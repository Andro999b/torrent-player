const Device = require('./Device')
const http = require('http')
const xml2js = require('xml2js')
const ejs = require('ejs')
const fs = require('fs')
const uuid = require('uuid')
const path = require('path')
const URL = require('url')
const querystring = require('querystring')
const { EventEmitter } = require('events')
const concat = require('concat-stream')
const debug = require('debug')('upnp')

const { RESOURCES_DIR } = require('../../config')

const UPNPError = require('./UPNPError')

const RENDER_SOAP_RES = ejs.compile(fs.readFileSync(path.join(RESOURCES_DIR, 'xml', 'soap-res.xml'), 'utf8'))

class Server extends EventEmitter {
    constructor(options) {
        super()

        options = options || {}

        this.prefix = options.prefix || ''
        this.port = options.port || 5002
        this.devices = {}

        this.httpHandlers = {
            [`GET ${this.prefix}/device/desc.xml`]: this._handleGetDeviceDescription,
            [`GET ${this.prefix}/service/desc.xml`]: this._handleGetServiceDescription,
            [`POST ${this.prefix}/service/control`]: this._handlePostControl,
            [`SUBSCRIBE ${this.prefix}/service/eventSub`]: this._handleSubscribeEventSub,
            [`UNSUBSCRIBE ${this.prefix}/service/eventSub`]: this._handleUnSubscribeEventSub
        }

        this.httpServer = http.createServer(this._handleRequest.bind(this))
    }

    _handleRequest(req, res) {
        const url = URL.parse(req.url)
        req.query = querystring.parse(url.query)
        
        const handler = this.httpHandlers[`${req.method} ${url.pathname}`]
        if (!handler) {
            res.statusCode = 404
            res.end('Not found')
            return
        }

        req.pipe(concat((buf) => {
            req.data = buf
            handler.call(this, req, res, url)
        }))
    }

    _handleGetDeviceDescription(req, res) {
        const udn = req.query['udn']
        const device = this.devices[udn]

        if (!device) {
            res.statusCode = 404
            res.end('Device not found')
            return
        }

        res.setHeader('Content-Type', 'text/xml;charset=utf-8')
        res.end(device.renderDescription(), 'utf8')
    }

    _handleGetServiceDescription(req, res) {
        const service = this._getService(req)

        if (!service) {
            res.statusCode = 404
            res.end('Service not found')
            return
        }

        res.setHeader('Content-Type', 'text/xml;charset=utf-8')
        res.end(service.renderDescription(), 'utf8')
    }

    _handlePostControl(req, res) {
        const service = this._getService(req)

        let actionName = req.headers['SOAPACTION'] || req.headers['soapaction']
        actionName =
            actionName &&
            actionName.substring(
                actionName.lastIndexOf('#') + 1,
                actionName.length - 1
            )

        if (!service || !actionName) {
            res.statusCode = 404
            res.end('Service or action not found', 'utf8')
            return
        }

        xml2js.parseString(
            req.data,
            {
                mergeAttrs: true,
                explicitArray: false,
                tagNameProcessors: [xml2js.processors.stripPrefix],
                ignoreAttrs: true
            },
            (err, json) => {
                if (err) {
                    res.statusCode = 400
                    res.end(`Request is not a valide XML message: ${err.message}`)
                    debug(`Bad xml request: ${req.data}`)
                } else {
                    try {
                        let inputs = json.Envelope.Body[actionName]

                        debug(`Service controll input: ${inputs}`)

                        if (typeof inputs == 'undefined') {
                            throw new Error()
                        }
                        if (typeof inputs == 'string') {
                            inputs = {}
                        }

                        const options = {
                            serviceType: service.serviceType,
                            actionName
                        }

                        new Promise((resolve, reject) => {
                            try {
                                resolve(
                                    service.implementation[actionName].call(
                                        service,
                                        inputs,
                                        req
                                    ) || {}
                                )
                            } catch (e) {
                                reject(e)
                            }
                        })
                            .then((outputs) =>
                                Object.assign(options, { outputs })
                            )
                            .catch((e) =>
                                Object.assign(options, {
                                    error: new UPNPError(e.message, 501)
                                })
                            )
                            .then((options) => {
                                res.setHeader('Content-Type', 'text/xml;charset=utf-8')
                                res.end(RENDER_SOAP_RES(options), 'utf8')
                            })
                    } catch (e) {
                        res.statusCode = 400
                        res.end(
                            'Request is not a valide uPnP/SOAP message',
                            'utf8'
                        )
                        debug(`Service controll error: ${e.message}`)
                    }
                }
            }
        )
    }

    _handleSubscribeEventSub(req, res) {
        const service = this._getService(req)

        if(service == null) {
            res.statusCode = 404
            res.end('Service not found', 'utf8')
            return
        }

        const sid = 'uuid:' + uuid()

        if(req.headers.callback) {
            const callbacks = req.headers.callback.replace(/[<|>]/g,'').split(',')
            service.addSubscriptions(sid, callbacks)
        }

        res.setHeader('DATE', new Date().toUTCString())
        res.setHeader('SID',  'uuid:' + uuid())
        res.setHeader('TIMEOUT', req.headers.timeout || 'Second-1800')
        res.setHeader('Content-Type', 'text/xml;charset=utf-8')
        res.end(service.getEventResponse(), 'utf8')
    }

    _handleUnSubscribeEventSub(res, req) {
        const service = this._getService(req)
        const { sid } = req.headers

        if(service == null || sid == null) {
            res.statusCode = 404
            res.end('Service or sid not found', 'utf8')
            return
        }

        service.removeSubscriptions(sid)
        
        res.end()
    }

    _getService(req) {
        const usn = req.query['usn'] || ''
        const split = usn.split('::')

        if (split.length == 2) {
            const udn = split[0]
            const serviceType = split[1]
            const device = this.devices[udn]
            return device && device.services[serviceType]
        }

        return null
    }

    createDevice(options) {
        options = options || {}
        var device = new Device(this, options)
        this.devices[device.uuid] = device
        return device
    }

    start(cb) {
        this.httpServer.listen(this.port, cb)

        Object.keys(this.devices).forEach((uuid) => {
            this.devices[uuid].start()
        })
    }

    close() {
        this.httpServer.close()

        Object.keys().forEach((uuid) => {
            this.devices[uuid].stop()
        })
    }
}

module.exports = Server

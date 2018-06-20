const Device = require('./Device')
const http = require('http')
const xml2js = require('xml2js')
const ejs = require('ejs')
const fs = require('fs')
const URL = require('url')
const querystring = require('querystring')
const { EventEmitter } = require('events')
const concat = require('concat-stream')
const debug = require('debug')('upnp')

const UPNPError = require('./UPNPError')

const RENDER_SOAP_RES = ejs.compile(
    fs.readFileSync('resources/xml/soap-res.xml', 'utf8')
)

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
            [`POST ${this.prefix}/service/control`]: this._handlePostControl
        }

        this.httpServer = http.createServer(this._handleRequest.bind(this))
    }

    _handleRequest(req, res) {
        const url = URL.parse(req.url)
        req.query = querystring.parse(url.query)
        const handler = this.httpHandlers[`${req.method} ${url.pathname}`]
        if (handler) {
            req.pipe(concat((buf) => {
                req.data = buf
                handler.call(this, req, res, url)
            }))
        } else {
            res.statusCode = 404
            res.end('Not found')
        }
    }

    _handleGetDeviceDescription(req, res) {
        const udn = req.query['udn']
        const device = this.devices[udn]
        if (device) {
            res.setHeader('Content-Type', 'text/xml;charset=utf-8')
            res.end(device.renderDescription(), 'utf8')
        } else {
            res.statusCode = 404
            res.end('Device not found')
        }
    }

    _handleGetServiceDescription(req, res) {
        const service = this._getService(req)
        if (service) {
            res.setHeader('Content-Type', 'text/xml;charset=utf-8')
            res.end(service.renderDescription(), 'utf8')
        } else {
            res.statusCode = 404
            res.end('Service not found')
        }
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

        if (service && actionName) {
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
                                    res.setHeader(
                                        'Content-Type',
                                        'text/xml;charset=utf-8'
                                    )
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
        } else {
            res.statusCode = 404
            res.end('Service or action not found', 'utf8')
        }
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

const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const superagent = require('superagent')
const { RESOURCES_DIR } = require('../../config')

const RENDER_SERVICE = ejs.compile(fs.readFileSync(path.join(RESOURCES_DIR, 'xml', 'service-desc.xml'), 'utf8'))
const RENDER_EVENT = ejs.compile(fs.readFileSync(path.join(RESOURCES_DIR, 'xml', 'event.xml'), 'utf8'))

class Service {
    constructor(device, options) {
        this.device = device
        this.domain = options.domain || this.device.domain || null
        this.type = options.type || null
        this.version = options.version || '1'
        this.serviceId = options.serviceId || 'urn:' + (this.domain || '') + ':serviceId:' + (this.type || '')
        this.serviceType = options.serviceType || 'urn:' + (this.domain || '') + ':service:' + (this.type || '') + ':' + (this.version || '')
        this.description = options.description || null
        this.USN = this.device.uuid + '::' + this.serviceType
        this.SCPDURL = this.device.server.prefix + '/service/desc.xml?usn=' + this.USN
        this.controlURL = this.device.server.prefix + '/service/control?usn=' + this.USN
        this.eventSubURL = this.device.server.prefix + '/service/eventSub?usn=' + this.USN
        this.configId = 1
        this.implementation = options.implementation || null
        this.subscriptions = {}
        this.variables = {}

        const descValiables = options.description.variables
        Object.keys(descValiables).forEach((key) => {
            const valiable = descValiables[key]
            if(valiable.event) {
                this.variables[key] = valiable.defaultValue || ''
            }
        })
    }

    renderDescription() {
        if (!this.descrtiptionXml) {
            this.descrtiptionXml = RENDER_SERVICE({
                actions: (this.description && this.description.actions) || {},
                variables: (this.description && this.description.variables) || {},
                configId: this.configId
            })
        }
        return this.descrtiptionXml
    }

    addSubscriptions(sid, callbacks) {
        this.subscriptions[sid] = callbacks
    }

    removeSubscriptions(sid) {
        delete this.subscriptions[sid]
    }

    notify(names) {
        const eventXml = this.getEventResponse(names)
        for(const sid in this.subscriptions) {
            const callbacks = this.subscriptions[sid]
            for(const callback of callbacks) {
                const url = URL.parse(callback)
                superagent
                    .post(url)
                    .set({
                        'Content-Type': 'text/xml; charset="utf-8"',
                        NT: 'upnp:event',
                        NTS: 'upnp:propchange',
                        SID: sid,
                        SEQ: 0
                    })
                    .send(eventXml)
                    .end()
            }
        }
    }

    getEventResponse(names) {
        let variables = this.variables
        if(names) {
            variables = {}
            names.forEach((name) => variables[name] = this.variables[name])
        }

        return RENDER_EVENT({ variables })
    }

    setVariables(variables) {
        this.variables = { ...this.variables, ...variables }
    }
}

module.exports = Service

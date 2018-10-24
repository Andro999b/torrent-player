const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const { RESOURCES_DIR } = require('../../config')

const RENDER_SERVICE = ejs.compile(
    fs.readFileSync(path.join(RESOURCES_DIR, 'xml', 'service-desc.xml'), 'utf8')
)

class Service {
    constructor(device, options) {
        this.device = device
        this.domain = options.domain || this.device.domain || null
        this.type = options.type || null
        this.version = options.version || '1'
        this.serviceId =
            options.serviceId ||
            'urn:' + (this.domain || '') + ':serviceId:' + (this.type || '')
        this.serviceType =
            options.serviceType ||
            'urn:' +
                (this.domain || '') +
                ':service:' +
                (this.type || '') +
                ':' +
                (this.version || '')
        this.description = options.description || null
        this.USN = this.device.uuid + '::' + this.serviceType
        this.SCPDURL = this.device.server.prefix + '/service/desc.xml?usn=' + this.USN
        this.controlURL = this.device.server.prefix + '/service/control?usn=' + this.USN
        this.configId = 1
        this.implementation = options.implementation || null
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
}

module.exports = Service

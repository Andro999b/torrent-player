const uuid = require('uuid')
const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const Service = require('./Service')
const SsdpServer = require('node-ssdp').Server
const { RESOURCES_DIR } = require('../../config')

const RENDER_DEVICE = ejs.compile(
    fs.readFileSync(path.join(RESOURCES_DIR, 'xml', 'device-desc.xml'), 'utf8')
)

class Device {
    constructor(server, options) {
        this.server = server
        this.uuid = options.uuid || uuid.v4()
        this.domain = options.domain || null
        this.type = options.type || null
        this.version = options.version || '1'
        this.productName = options.productName || 'unknown'
        this.productVersion = options.productVersion || '0.0'
        this.deviceType =
            options.deviceType ||
            'urn:' +
                (this.domain || '') +
                ':device:' +
                (this.type || '') +
                ':' +
                this.version
        this.friendlyName = options.friendlyName || null
        this.manufacturer = options.manufacturer || null
        this.manufacturerURL = options.manufacturerURL || null
        this.modelDescription = options.modelDescription || null
        this.modelName = options.modelName || null
        this.modelNumber = options.modelNumber || null
        this.modelURL = options.modelURL || null
        this.serialNumber = options.serialNumber || null
        this.UDN = 'uuid:' + this.uuid
        this.UPC = options.UPC || null
        this.presentationURL = options.presentationURL || null
        this.descriptionURL =
            this.server.prefix + '/device/desc.xml?udn=' + this.uuid
        this.icons = options.icons || []
        this.configId = 1
        this.services = {}        
    }

    createService(options) {
        options = options || {}
        var service = new Service(this, options)

        this.services[service.serviceType] = service
        
        return service
    }

    start() {
        this.ssdpServer = new SsdpServer({
            location: {
                port: this.server.port,
                path: this.descriptionURL
            },
            udn: this.UDN
        })

        this.ssdpServer.addUSN('upnp:rootdevice')
        this.ssdpServer.addUSN(this.deviceType)
        Object.keys(this.services).forEach((key) => 
            this.ssdpServer.addUSN(this.services[key].serviceType)
        )

        this.ssdpServer.start()
    }

    stop() {
        if(this.ssdpServer)
            this.ssdpServer.stop()
    }

    renderDescription() {
        if (!this.descrtiptionXml) {
            this.descrtiptionXml = RENDER_DEVICE(this)
        }
        return this.descrtiptionXml
    }
}

module.exports = Device

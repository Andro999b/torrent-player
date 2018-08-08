const { EventEmitter } = require('events')
const { pick } = require('lodash')
const RemoteDevice = require('./RemoteDevice')
const RemoteControl = require('./RemoteControl')
const BiMap = require('bidirectional-map')

class RemoteService extends EventEmitter {
    constructor() {
        super()
        this.devices = {}
        this.controls = {}
        this.connections = new BiMap()
    }

    // eslint-disable-next-line
    addDevice(device) {
        if (this.devices[device.id])
            throw new Error(`Remote device with id=${device.id} already exists`)

        this.devices[device.id] = device
        this._attachDeviceListeners(device)
        this.emit(RemoteService.Events.DeviceList)
    }

    // eslint-disable-next-line
    removeDevice(deviceId) {
        const device = this.devices[deviceId]

        if (device) {
            this._removeDeviceListener(device)
            delete this.devices[deviceId]
            this.emit(RemoteService.Events.DeviceList)

            //TODO: notify controll of dissconection
            this._doWithControlConnection(device.id, (control) => control.disconnect())
            this.connections.deleteValue(device.id)
        }
    }

    addControl(control) {
        if (this.controls[control.id])
            throw new Error(`Remote control with id=${control.id} already exists`)

        this.controls[control.id] = control
        this._attachControlListeners(control)
    }

    removeControl(controlId) {
        const control = this.controls[controlId]

        if (control) {
            this._removeControlListeners(control)
            delete this.controls[controlId]
            this.connections.delete(controlId)
        }
    }

    getDevicesDescriptions() {
        return Object.values(this.devices).map((device) =>
            pick(device, ['id', 'state', 'name'])
        )
    }

    connect(controlId, deviceId) {
        this.connections.set(controlId, deviceId)
    }

    disconnect(controlId) {
        this.connections.delete(controlId)
    }

    //device section
    _attachDeviceListeners(device) {
        device.on(RemoteDevice.Events.Sync, this._handleDeviceSync(device))
    }

    _removeDeviceListener(device) {
        device.removeAllListeners(RemoteDevice.Events.Sync)
    }

    _doWithControlConnection(deviceId, fun) {
        const controlId = this.connections.getKey(deviceId)
        if (controlId) {
            const control = this.controls[controlId]
            if (control) {
                fun(control)
            }
        }
    }

    _handleDeviceSync(device) {
        return (state) => {
            this._doWithControlConnection(device.id, (control) => {
                control.syncState(state)
            })
        }
    }

    _attachControlListeners(control) {
        control.on(RemoteControl.Events.Action, this._handleControllAction)
    }

    _removeControlListeners(control) {
        control.removeAllListeners(RemoteControl.Events.Action)
    }

    _doWithDeviceConnection(controlId, fun) {
        const deviceId = this.connections.get(controlId)
        if (deviceId) {
            const device = this.devices[deviceId]
            if (device) {
                fun(device)
            }
        }
    }

    _handleControllAction(control) {
        return (event) => {
            this._doWithControlConnection(control.id, (device) => {
                switch (event.action) {
                    case RemoteControl.Actions.Play:
                        device.play(event.payload)
                        break
                    case RemoteControl.Actions.Pause:
                        device.pause()
                        break
                    case RemoteControl.Actions.Seek:
                        device.seek(event.payload)
                        break
                    case RemoteControl.Actions.OpenPlaylist: {
                        const { playlist, fileIndex} = event.payload
                        device.openPlaylist(playlist, fileIndex)
                        break
                    }
                    case RemoteControl.Actions.ClosePlaylist:
                        device.ClosePlaylist()
                        break
                }
            })
        }
    }
}

RemoteService.Events = {
    DeviceList: 'divicesList'
}

module.exports = RemoteService
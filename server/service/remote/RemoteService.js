const { EventEmitter } = require('events')
const { pick } = require('lodash')

const bookmarks =  require('../bookmarks')

const RemoteDevice = require('./RemoteDevice')
const RemoteControl = require('./RemoteControl')

const BiMap = require('bidirectional-map')
const debug = require('debug')('remote')

class RemoteService extends EventEmitter {
    constructor() {
        super()
        this.devices = {}
        this.controls = {}
        this.connections = new BiMap()
        this.anyStateChanged = false

        setInterval(
            this._storeDeviceState.bind(this), 
            10 * 1000
        )
    }

    stopPlayTorrent(torrentId) {
        Object.values(this.devices)
            .filter(
                (device) => {
                    const { playlist } = device.state
                    if(!playlist) return false

                    const { torrentInfoHash } = playlist
                    return torrentInfoHash == torrentId
                }
            )
            .forEach((device) => {
                // clear connections
                this._doWithControlConnection(device.id, (control) => control.disconnect())
                this.connections.deleteValue(device.id)

                // clear device state
                device.clearState(false)
                device.doAction(RemoteControl.Actions.ClosePlaylist)

                this._invalidateDeviceList()
            })
    }

    // eslint-disable-next-line
    addDevice(device) {
        if (this.devices[device.id])
            throw new Error(`Remote device with id=${device.id} already exists`)

        this.devices[device.id] = device
        this._attachDeviceListeners(device)
        this._invalidateDeviceList()

        debug(`New device added ${device.id}`)
    }

    // eslint-disable-next-line
    removeDevice(deviceId) {
        const device = this.devices[deviceId]

        if (device) {
            this._doWithControlConnection(device.id, (control) => control.disconnect())
            this.connections.deleteValue(device.id)

            this._removeDeviceListener(device)
            delete this.devices[deviceId]
            device.destroy()

            this._invalidateDeviceList()
            debug(`Device removed ${deviceId}`)
        }
    }

    addControl(control) {
        if (this.controls[control.id])
            throw new Error(`Remote control with id=${control.id} already exists`)

        this.controls[control.id] = control
        this._attachControlListeners(control)

        debug(`New control added ${control.id}`)
    }

    removeControl(controlId) {
        const control = this.controls[controlId]

        if (control) {
            this._removeControlListeners(control)
            delete this.controls[controlId]
            this.connections.delete(controlId)
            this._invalidateDeviceList()
        }

        debug(`Control removed ${controlId}`)
    }

    getDevicesDescriptions() {
        return Object.values(this.devices)
            .filter((device) => device.avaliable && !this.connections.hasValue(device.id))
            .map((device) =>
                pick(device, ['id', 'state', 'name', 'playlistName'])
            )
    }

    connect(controlId, deviceId) {
        const control = this.controls[controlId]
        const device = this.devices[deviceId]

        if (!device)
            throw new Error('Device not exists')

        if (!device.avaliable)
            throw new Error('Device unavaliable')

        if (!control)
            throw new Error('Control not exists')

        if (this.connections.hasValue(deviceId))
            throw new Error('Device already connected')

        this.connections.set(controlId, deviceId)
        this._invalidateDeviceList()

        control.connected(device.state)

        debug(`New connection control: ${controlId} device: ${deviceId}`)
    }

    disconnect(controlId, deviceId) {
        if (deviceId) {
            const connectedDeviceId = this.connections.get(controlId)
            if (connectedDeviceId == deviceId) {
                this.connections.delete(controlId)
                this.controls[controlId].disconnect()
                this._invalidateDeviceList()

                debug(`Connection removed: ${controlId} device: ${deviceId}`)
            }
        }
    }

    //device section
    _attachDeviceListeners(device) {
        device.on(RemoteDevice.Events.Sync, this._handleDeviceSync(device))
        device.on(RemoteDevice.Events.Clear, this._handleDeviceClear(device))
        device.on(RemoteDevice.Events.UpdateList, this._invalidateDeviceList.bind(this))
    }

    _removeDeviceListener(device) {
        device.removeAllListeners(RemoteDevice.Events.Sync)
        device.removeAllListeners(RemoteDevice.Events.Clear)
        device.removeAllListeners(RemoteDevice.Events.UpdateList)
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
            this.anyStateChanged = true
            this._doWithControlConnection(device.id, (control) => {
                control.syncState(state)
                debug(`Sync state from device ${device.id} to control ${control.id}`)
            })
        }
    }

    _handleDeviceClear(device) {
        return () => {
            this._doWithControlConnection(device.id, (control) => {
                this.disconnect(control.id, device.id)
            })
        }
    }

    _attachControlListeners(control) {
        control.on(RemoteControl.Events.Action, this._handleControllAction(control))
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
            this._doWithDeviceConnection(control.id, (device) => {
                device.doAction(event.action, event.payload)
                debug(`Send action ${event.action} from control ${control.id} to device ${device.id}`)
            })
        }
    }

    _invalidateDeviceList() {
        clearTimeout(this.updateTimeout)
        this.updateTimeout = setTimeout(() => {
            this.emit(RemoteService.Events.DeviceList)
        }, 1000)
    }

    _storeDeviceState() {
        if(this.anyStateChanged) {
            this.anyStateChanged = false

            Object.values(this.devices).forEach((device) => {
                const { playlistName, state } = device
                if(playlistName) {
                    bookmarks.update(playlistName, state)
                }
            })
        }
    }
}

RemoteService.Events = {
    DeviceList: 'devicesList'
}

module.exports = RemoteService
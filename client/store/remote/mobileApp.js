import { observable, action } from 'mobx'
import transitionStore from '../transition-store'
import BaseRemoteDevice from './BaseRemoteDevice'

class MobileAppRemoteDevice extends BaseRemoteDevice {
    isConnected = false

    isLocal = () => false

    constructor(device) {
        super()
        this.device = device
    }

    getName = () => this.device.name

    connect() {
        this.isLoading = true
    }

    disconnect() {
        mobileApp.disconnectDevice()
    }

    closePlaylist(ack) {
        this.sendAction('closePlaylist')
        setTimeout(ack, 200)
    }

    @action sendAction(action, payload) {
        mobileApp.sendDeviceAction(JSON.stringify({ action, payload }))
    }

    @action.bound onConnected(state) {
        this.onSync(state)
        this.isLoading = false
        this.isConnected = true
    }

    @action.bound onDisconnected() {
        this.error = 'Device disconnected'
        this.isConnected = false
    }
}

export default () => {
    const devices = observable.array([])
    const deviceName = null
    const setAvailability = () => { }
    const isCastAvaliable = false

    let currentRemoteDevice

    const getRemoteDevice = (device) => {
        currentRemoteDevice = new MobileAppRemoteDevice(device)
        mobileApp.connectToDevice(JSON.stringify(device))
        return currentRemoteDevice
    }

    if (window.mobileApp != null) {
        mobileApp.setCommandListener('commandListener')

        window.commandListener = (command, data) => {
            switch (command) {
                case 'devicesList': {
                    devices.replace(data)
                    return
                }
                case 'restoreDevice': {
                    transitionStore.connectToDevice(data)
                    return
                }
                case 'deviceClosed': {
                    transitionStore.stopPlayMedia()
                    return
                }
            }

            if (currentRemoteDevice) {
                switch (command) {
                    case 'deviceConnected': {
                        currentRemoteDevice.onConnected(data)
                        return
                    }
                    case 'deviceDisconnected': {
                        currentRemoteDevice.onDisconnected()
                        return
                    }
                    case 'sync': {
                        currentRemoteDevice.onSync(data)
                        return
                    }
                }
            }
        }
    }

    return {
        devices,
        deviceName,
        setAvailability,
        getRemoteDevice,
        isCastAvaliable
    }
}


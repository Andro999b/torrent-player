/* global mobileApp */
import { observable, action } from 'mobx'
import { Device } from '../player-store'
import { ALLOWED_REMOTE_STATE_FIELDS } from '../../constants'
import pick from 'lodash.pick'
import transitionStore from '../transition-store'

class MobileAppRemoteDevice extends Device {
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
        setTimeout(() => mobileApp.disconnectDevice(), 200)
    }

    resume() {
        this.sendAction('resume')
    }

    pause() {
        this.sendAction('pause')
    }

    play(currentTime) {
        this.sendAction('play', currentTime)
    }

    @action seek(currentTime) {
        this.currentTime = currentTime
        this.sendAction('seek', currentTime)
    }

    @action setVolume(volume) {
        this.volume = volume
        this.sendAction('setVolume', volume)
    }

    selectFile(fileIndex) {
        this.sendAction('selectFile', fileIndex)
    }

    toggleMute() {
        this.sendAction('toggleMute')
    }

    @action setPlaylist(playlist, fileIndex) {
        this.playlist = playlist
        this.currentFileIndex = fileIndex
        this.sendAction('openPlaylist', { playlist, fileIndex })
    }

    closePlaylist() {
        this.sendAction('closePlaylist')
    }

    @action sendAction(action, payload) {
        mobileApp.sendDeviceAction(JSON.stringify({ action, payload }))
    }

    @action.bound onSync(state) {
        const filteredState = pick(state, ALLOWED_REMOTE_STATE_FIELDS)
        Object.keys(filteredState).forEach((key) => {
            this[key] = filteredState[key]
        })
    }

    @action.bound onConnected(state) {
        this.onSync(state)
        this.isLoading = false
    }

    @action.bound onDisconnected() {
        this.error = 'Device disconnected'
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


import { autorun, observable, action } from 'mobx'
import playerStore, { Device, LocalDevice } from '../player-store'
import transitionStore from '../transition-store'
import urljoin from 'url-join'
import { diff, isMobile } from '../../utils'
import { API_BASE_URL } from '../../utils/api'
import io from 'socket.io-client'
import pick from 'lodash.pick'
import { ALLOWED_REMOTE_STATE_FIELDS } from '../../constants'

const devices = observable([])
const deviceName = observable.box('')

class RemoteDevice extends Device {
    constructor(socket, device) {
        super()
        this.socket = socket
        this.device = device
    }

    isLocal() {
        return false
    }

    connect() {
        this.socket.emit('connectDevice', this.device.id)

        this.socket.on('deviceConnected', this.onConnected)
        this.socket.on('deviceDisconnected', this.onDisconnected)
        this.socket.on('sync', this.onSync)
        this.socket.on('reconnect', () => {
            this.socket.emit('connectDevice', this.device.id)
        })

        this.isLoading = true
    }

    getName() {
        return this.device.name
    }

    disconnect() {
        this.socket.disconnect()
    }

    @action.bound onConnected(state) {
        this.onSync(state)
        this.isLoading = false
    }

    @action.bound onDisconnected() {
        this.error = 'Device disconnected'
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
        this.socket.emit('action', { action, payload })
    }

    @action.bound onSync(state) {
        const filteredState = pick(state, ALLOWED_REMOTE_STATE_FIELDS)
        Object.keys(filteredState).forEach((key) => {
            this[key] = filteredState[key]
        })
    }
}

function getRemoteDevice(device) {
    const deviceSocket = io(urljoin(API_BASE_URL, '/control'))
    return new RemoteDevice(deviceSocket, device)
}

function trackState(socket) {
    let prevState = {}
    autorun(() => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            let newState = pick(device, ALLOWED_REMOTE_STATE_FIELDS)

            const stateDiff = diff(prevState, newState)
            prevState = newState

            socket.emit('sync', stateDiff)
        } else {
            prevState = {}
            socket.emit('clear')
        }
    }, { delay: 1000 })

    socket.on('reconnect', () => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            socket.emit('sync', pick(device, ALLOWED_REMOTE_STATE_FIELDS))
        } else {
            socket.emit('clear')
        }
    })
}

function listenIncomeControls(socket) {
    socket.on('action', ({ action, payload }) => {
        const { device } = playerStore

        switch (action) {
            case 'openPlaylist': {
                const { playlist, fileIndex } = payload
                transitionStore.goToScreen('player')
                playerStore.openPlaylist(new LocalDevice(), playlist, fileIndex)
                return
            }
            case 'closePlaylist':
                transitionStore.stopPlayMedia()
                return
        }

        if (!device || !device.isLocal()) return

        if (typeof device[action] === 'function')
            device[action](payload)
    })
}

function listenNameUpdate(socket) {
    socket.on('updateName', (newName) => deviceName.set(newName))
    socket.on('connect', () => socket.emit('getName'))
}

let setAvailability = () => {}
let isCastAvaliable = !isMobile()

const deviceSocket = io(urljoin(API_BASE_URL, '/device'))
trackState(deviceSocket)

if(isCastAvaliable) {
    trackState(deviceSocket)
    listenIncomeControls(deviceSocket)
    listenNameUpdate(deviceSocket)
    setAvailability = (avaliable) => {
        deviceSocket.emit('setAvailability', avaliable)
    }
}

function listenDeviceList(socket) {
    socket.on('devicesList', (newDevices) => { 
        devices.replace(
            newDevices.filter((dev) =>  dev.id != newDevices.id)
        ) 
    })
}

listenDeviceList(io(API_BASE_URL))

export default {
    devices,
    deviceName,
    setAvailability,
    getRemoteDevice,
    isCastAvaliable
}
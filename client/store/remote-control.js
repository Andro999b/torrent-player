import { autorun, observable, action } from 'mobx'
import playerStore, { Device, LocalDevice } from './player-store'
import transitionStore from './transition-store'
import { diff, pick } from '../utils'
import io from 'socket.io-client'

const socket = io({ path: '/rc' })
const devices = observable([])
const deviceName = observable.box('')
const ALLOWED_STATE_FIELDS = [
    'playlist',
    'currentFileIndex',
    'currentTime',
    'duration',
    'buffered',
    'isPlaying',
    'isLoading',
    'error',
    'volume',
    'isMuted'
]

class RemoteDevice extends Device {
    constructor(device) {
        super()
        this.device = device
    }

    isLocal() {
        return false
    }

    connect() {
        socket.emit('connectDevice', this.device.id)

        socket.on('deviceConnected', this.onConnected)
        socket.on('deviceDisconnected', this.onDisconnected)
        socket.on('sync', this.onSync)

        this.isLoading = true
    }

    getName() {
        return this.device.name
    }

    disconnect() {
        socket.emit('disconnectDevice', this.device.id)
        socket.off('deviceConnected')
        socket.off('deviceDisconnected')
        socket.off('sync')
    }

    @action.bound onConnected() {
        // console.log('remote device connected')
        this.isLoading = false
    }

    @action.bound onDisconnected() {
        this.error = 'Device disconnected'
    }

    pause() {
        this.sendAction('pause')
    }

    play(currentTime) {
        this.sendAction('play', currentTime)
    }

    seek(currentTime) {
        this.sendAction('seek', currentTime)
    }

    setVolume(volume) {
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
        this.isLoading = true
        socket.emit('action', { action, payload })
    }

    @action.bound onSync(state) {
        this.isLoading = false
        const filteredState = pick(state, ALLOWED_STATE_FIELDS)
        Object.keys(filteredState).forEach((key) => {
            this[key] = filteredState[key]
        })
    }
}

function trackState() {
    let prevState = {}
    autorun(() => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            let newState = pick(device, ALLOWED_STATE_FIELDS)

            const stateDiff = diff(prevState, newState)
            prevState = newState

            socket.emit('sync', stateDiff)
        } else {
            prevState = {}
            socket.emit('clear')
        }
    }, { delay: 1000 })
}

function listenIncomeControls() {
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
                playerStore.closePlaylist()
                return
        }

        if (!device || !device.isLocal()) return

        if (typeof device[action] === 'function')
            device[action](payload)
    })
}

function listenNameUpdate() {
    socket.on('updateName', (newName) => deviceName.set(newName))
    socket.emit('getName')
}

function listenDeviceList() {
    socket.on('divicesList', (newDevices) => devices.replace(newDevices))
}

export function setAvailability(available) {
    socket.emit('setAvailability', available)
}

export function getRemoteDevice(device) {
    return new RemoteDevice(device)
}

trackState()
listenIncomeControls()
listenDeviceList()
listenNameUpdate()

export default {
    devices,
    deviceName
}
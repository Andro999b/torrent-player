import { autorun, observable, action } from 'mobx'
import playerStore, { LocalDevice } from '../player-store'
import transitionStore from '../transition-store'
import urljoin from 'url-join'
import { diff, isTouchDevice } from '../../utils'
import { API_BASE_URL } from '../../utils/api'
import io from 'socket.io-client'
import pick from 'lodash.pick'
import { ALLOWED_REMOTE_STATE_FIELDS } from '../../constants'
import BaseRemoteDevice from './BaseRemoteDevice'

class RemoteDevice extends BaseRemoteDevice {
    @observable isConnected = false

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
        this.socket.on('disconnect', (reason) => {
            switch(reason) {
                case 'io server disconnect':
                case 'transport error':
                case 'transport close':
                    this.error = 'Connection lost'
                    this.isConnected = false
            }
        })
        this.socket.on('reconnect_failed', () => {
            this.error = 'Connection lost'
            this.isConnected = false
        })

        this.isLoading = true
    }

    getName = () => this.device.name

    disconnect() {
        this.socket.disconnect()
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

    closePlaylist(ack) {
        this.sendAction('closePlaylist', null, ack)
    }

    @action sendAction(action, payload, ack) {
        this.socket.emit('action', { action, payload }, ack)
    }
}

export default () => {

    const devices = observable([])
    const deviceName = observable.box('')

    function getRemoteDevice(device) {
        const deviceSocket = io(urljoin(API_BASE_URL, '/control'))
        return new RemoteDevice(deviceSocket, device)
    }

    function trackState(socket) {
        let prevState = {}
        autorun(() => {
            const { device } = playerStore
            if (device && device.isLocal()) {
                const newState = pick(device, ALLOWED_REMOTE_STATE_FIELDS)
                const stateDiff = diff(prevState, newState)

                prevState = newState

                if(Object.keys(stateDiff).length > 0) {
                    socket.emit('sync', stateDiff)
                }
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
                    const { playlist, fileIndex, marks } = payload
                    transitionStore.goToScreen('player')
                    playerStore.openPlaylist(new LocalDevice(), playlist, fileIndex, marks)
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

    let setAvailability = () => { }

    let isCastAvaliable = !isTouchDevice()

    if (isCastAvaliable) {
        let lastAvaliable = false
        const deviceSocket = io(urljoin(API_BASE_URL, '/device'))

        deviceSocket.on('updateName', (newName) => deviceName.set(newName))
        deviceSocket.on('reconnect', () => {
            deviceSocket.emit('setAvailability', lastAvaliable)
        })

        trackState(deviceSocket)
        listenIncomeControls(deviceSocket)
        setAvailability = (avaliable) => {
            lastAvaliable = avaliable
            deviceSocket.emit('setAvailability', avaliable)
        }
    }

    function listenDeviceList(socket) {
        socket.on('devicesList', (newDevices) => {
            devices.replace(
                newDevices.filter((dev) => dev.id != newDevices.id)
            )
        })
    }

    const rootSocket = io(API_BASE_URL)
    listenDeviceList(rootSocket)

    return {
        devices,
        deviceName,
        setAvailability,
        getRemoteDevice,
        isCastAvaliable
    }
}

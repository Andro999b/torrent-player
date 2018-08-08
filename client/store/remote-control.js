import { autorun, observable } from 'mobx'
import playerStore, { LocalDevice } from './player-store'
import { diff, pick } from '../utils'
import io from 'socket.io-client'

const socket = io({ path: '/rc' })
export const devices = observable([])
export const deviceName = observable.box('')

function trackState(socket) {
    let prevState = {}
    autorun(() => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            let newState = pick(device, [
                'playlist',
                'currentFileIndex',
                'currentTime',
                'duration',
                'buffered',
                'isPlaying',
                'isLoading',
                'error'
            ])

            const stateDiff = diff(prevState, newState)
            prevState = newState

            socket.emit('sync', stateDiff)
        } else {
            prevState = {}
            socket.emit('clear')
        }
    }, { delay: 1000 })
}

function listenIncomeControls(socket) {
    const forLocalDevice = (value) => (cb) => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            cb(device, value)
        }
    }

    socket.on('play', forLocalDevice((device, currentTime) => device.play(currentTime)))
    socket.on('seek', forLocalDevice((device, currentTime) => device.seek(currentTime)))
    socket.on('pause', forLocalDevice((device) => device.pause()))
    socket.on('openPlaylist', (playlist, fileIndex) => playerStore.openPlaylist(new LocalDevice(), playlist, fileIndex))
    socket.on('closePlaylist', () => playerStore.closePlaylist())
}

function listenNameUpdate(socket) {
    socket.on('updateName', (newName) => deviceName.set(newName))
    socket.emit('getName')
}

function listenDeviceList(socket) {
    socket.on('divicesList', (newDevices) => devices.replace(newDevices))
}

export function getCurrentDeviceId() {
    return socket.id
}

trackState(socket)
listenIncomeControls(socket)
listenDeviceList(socket)
listenNameUpdate(socket)
const Server = require('socket.io')
const RemoteDevice = require('../service/remote/RemoteDevice')
const RemoteService = require('../service/remote/RemoteService')
const remoteService = require('../service/remote')

class SocketRemoteDevice extends RemoteDevice {
    constructor(socket) {
        super()
        this.id = socket.id
        this.socket = socket
        this.socket.on(RemoteDevice.Events.Sync, (state) => this.updateState(state))
        this.socket.on(SocketRemoteDevice.Events.Clear, () => this.clearState())
        this.socket.on('getName', () => {
            this.socket.emit('updateName', this.name)
        })
    }

    pause() {
        this.socket.emit(SocketRemoteDevice.Events.Pause)
    }

    play(currentTime) {
        this.socket.emit(SocketRemoteDevice.Events.Play, currentTime)
    }

    seek(currentTime) {
        this.socket.emit(SocketRemoteDevice.Events.Seek, currentTime)
    }

    openPlaylist(playlist, fileIndex) {
        this.socket.emit(SocketRemoteDevice.Events.OpenPlaylist, { playlist, fileIndex })
    }

    closePlaylist() {
        this.socket.emit(SocketRemoteDevice.Events.ClosePlaylist)
    }
}

SocketRemoteDevice.Events = {
    Pause: 'pause',
    Play: 'play',
    Seek: 'seek',
    OpenPlaylist: 'openPlaylist',
    ClosePlaylist: 'closePlaylist',
    Clear: 'clear'
}

function registerSocket(socket) {
    //register device
    const device = new SocketRemoteDevice(socket)
    remoteService.addDevice(device)

    //handle device list
    const deivcesList = () => {
        socket.emit(
            RemoteService.Events.DeviceList, 
            remoteService.getDevicesDescriptions().filter((d) => d.id != device.id)
        )
    }
    remoteService.addListener(RemoteService.Events.DeviceList, deivcesList)
    deivcesList()

    //handle disconnect
    socket.once('disconnect', () => {
        remoteService.removeDevice(socket.id)
        remoteService.removeListener(RemoteService.Events.DeviceList, deivcesList)
    })
}

module.exports = function (htppServer) {
    const io = Server(htppServer, { path: '/rc' })

    io.on('connection', registerSocket)

    // eslint-disable-next-line
    console.log('Remote control enabled')
}
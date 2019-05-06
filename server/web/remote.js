const Server = require('socket.io')
const RemoteDevice = require('../service/remote/RemoteDevice')
const RemoteControl = require('../service/remote/RemoteControl')
const RemoteService = require('../service/remote/RemoteService')
const remoteService = require('../service/remote')

class SocketRemoteDevice extends RemoteDevice {
    constructor(socket) {
        super()
        this.id = socket.id
        this.avaliable = false
        this.socket = socket
        this.socket.on(SocketRemoteDevice.Events.SetAvailability, (available) => this.setAvailability(available))
        this.socket.on(SocketRemoteDevice.Events.Sync, (state) => this.updateState(state))
        this.socket.on(SocketRemoteDevice.Events.Clear, () => this.clearState())
        this.socket.emit(SocketRemoteDevice.Events.UpdateName, this.name)
    }

    doAction(action, payload) {
        this.socket.emit(SocketRemoteDevice.Events.Action, { action, payload })
    }
}

SocketRemoteDevice.Events = {
    Action: RemoteControl.Events.Action,
    Sync: RemoteDevice.Events.Sync,
    Clear: 'clear',
    SetAvailability: 'setAvailability',
    UpdateName: 'updateName',
}

class SocketRemoteControl extends RemoteControl {
    constructor(socket) {
        super()
        this.id = socket.id
        this.socket = socket

        socket.on(SocketRemoteControl.Events.Action, ({action, payload}) => {
            if (action) {
                this.emit(RemoteControl.Events.Action, {action, payload})
            }
        })
    }

    connected(state) {
        this.socket.emit(SocketRemoteControl.Events.Connected, state)
    }

    syncState(state) {
        this.socket.emit(SocketRemoteControl.Events.Sync, state)
    }

    disconnect() {
        this.socket.emit(SocketRemoteControl.Events.Disconnected)
    }
}

SocketRemoteControl.Events = {
    Connected: 'deviceConnected',
    Disconnected: 'deviceDisconnected',
    Sync: 'sync',
    Action: RemoteControl.Events.Action
}

function registerControl(socket) {
    //register control
    const control = new SocketRemoteControl(socket)
    remoteService.addControl(control)

    //connect && disconect to device
    socket.on('connectDevice', (deviceId) => remoteService.connect(control.id, deviceId))
    socket.on('disconnectDevice', (deviceId) => remoteService.disconnect(control.id, deviceId))

    socket.on('disconnect', () => {
        remoteService.removeControl(control.id)
    })
}

function registerDevice(socket) {
    //register device
    const device = new SocketRemoteDevice(socket)
    remoteService.addDevice(device)

    //handle disconnect
    socket.on('disconnect', () => {
        remoteService.removeDevice(device.id)
    })
}

function registerSocket(socket) {
    //handle device list
    const deivcesList = () => {
        socket.emit(
            RemoteService.Events.DeviceList, 
            remoteService.getDevicesDescriptions()
        )
    }
    remoteService.addListener(RemoteService.Events.DeviceList, deivcesList)
    deivcesList()

    //handle disconnect
    socket.on('disconnect', () => {
        remoteService.removeListener(RemoteService.Events.DeviceList, deivcesList)
    })
}

module.exports = function (htppServer) {
    const io = Server(htppServer, {
        pingTimeout: 30000
    })

    io.on('connection', registerSocket)
    io.of('/control').on('connection', registerControl)
    io.of('/device').on('connection', registerDevice)

    // eslint-disable-next-line
    console.log('Remote control enabled')
}
const uuid = require('uuid')
const { EventEmitter } = require('events')

class RemoteDevice extends EventEmitter {

    constructor() {
        super()
        this.state = {}
        this.id = this.id || uuid()
        this.avaliable = true
        this.name = `Video Screan ${RemoteDevice.counter++}`
        this.playlistName = null
    }

    setAvailability(avaliable) {
        this.avaliable = avaliable
        this.emit(RemoteDevice.Events.UpdateList)
    }

    updateState(state) {
        Object.keys(state).forEach((key) => {
            this.state[key] = state[key]
        })
        this.emit(RemoteDevice.Events.Sync, state)

        if (state.playlist) {
            this.playlistName = state.playlist.name
            this.emit(RemoteDevice.Events.UpdateList)
        }
    }

    clearState(emitEvents = true) {
        this.state = {}
        this.playlistName = null
        if(emitEvents) {
            this.emit(RemoteDevice.Events.Sync, this.state)
            this.emit(RemoteDevice.Events.Clear)
        }
    }

    // eslint-disable-next-line
    doAction(action, payload) {}

    destroy() {}
}

RemoteDevice.counter = 0
RemoteDevice.Events = {
    Sync: 'sync',
    Clear: 'clear',
    UpdateList: 'updateList'
}

module.exports = RemoteDevice
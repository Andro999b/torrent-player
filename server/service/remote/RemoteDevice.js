const uuid = require('uuid')
const { EventEmitter } = require('events')

class RemoteDevice extends EventEmitter {

    constructor() {
        super()
        this.state = {}
        this.id = uuid()
        this.name = `Video Screan ${RemoteDevice.counter++}`
    }

    updateState(state) {
        Object.keys(state).forEach((key) => {
            this.state[key] = state[key]
        })
        this.emit(RemoteDevice.Events.Sync, this.state)
    }

    clearState() {
        this.state = {}
        this.emit(RemoteDevice.Events.Sync, this.state)
    }

    /* eslint-disable */
    pause() { }
    play(currentTime) { }
    seek(currentTime) { }

    openPlaylist(playlist, fileIndex) { }
    closePlaylist() { }
    /* eslint-enable */
}

RemoteDevice.counter = 0
RemoteDevice.Events = {
    Sync: 'sync'
}

module.exports = RemoteDevice
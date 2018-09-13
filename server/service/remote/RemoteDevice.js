const uuid = require('uuid')
const { EventEmitter } = require('events')

class RemoteDevice extends EventEmitter {

    constructor() {
        super()
        this.state = {}
        this.id = uuid()
        this.avaliable = true
        this.name = `Video Screan ${RemoteDevice.counter++}`
    }

    setAvailability(avaliable) {
        this.avaliable = avaliable
        this.emit(RemoteDevice.Events.UpdateList)
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
        this.emit(RemoteDevice.Events.Clear)
    }

    // eslint-disable-next-line
    doAction(action, payload){}
}

RemoteDevice.counter = 0
RemoteDevice.Events = {
    Sync: 'sync',
    Clear: 'clear',
    UpdateList: 'updateList'
}

module.exports = RemoteDevice
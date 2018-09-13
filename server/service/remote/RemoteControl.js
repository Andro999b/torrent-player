const uuid = require('uuid')
const { EventEmitter } = require('events')

class RemoteControl extends EventEmitter {
    constructor(){
        super()
        this.id = uuid()
    }

    // eslint-disable-next-line
    connected(state) {
    
    }

    // eslint-disable-next-line
    syncState(state) {

    }

    disconnect() {

    }
}

RemoteControl.Events = {
    Action: 'action'
}

RemoteControl.Actions = {
    Play: 'play',
    Pause: 'pause',
    Seek: 'seek',
    SelectFile: 'selectFile',
    OpenPlaylist: 'openPlaylist',
    ClosePlaylist: 'closePlaylist' 
}

module.exports = RemoteControl
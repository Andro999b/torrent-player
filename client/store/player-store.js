import { observable, autorun, action } from 'mobx'


class OutputDevice {
    @observable currentTime = 0
    @observable duration = 0
    @observable buffered = 0
    @observable isPlaying = false

    isSeekable() { return true }
    isLocal() { return true }

    /* eslint-disable no-unused-vars */
    setUrl(url) { }
    pause() { }
    play(currentTime) { }
    seek(currentTime) { }
    connect(onDisconnect) {}
    disconnect() { }
    /* eslint-enable */
}

class LocalOutput extends OutputDevice {
    @observable volume = 1
    @observable isMuted = true
    @observable isFullscreen = false
    @observable url = null
    @observable seekTime = null

    @action setVolume(volume) {
        this.volume = volume
    }

    @action setUrl(url) {
        if(url != this.url) {
            this.url = url
            this.currentTime = 0
        }
    }

    @action play(currentTime) {
        this.isPlaying = true
        if(currentTime != undefined) {
            this.currentTime = currentTime
        }
    }

    @action seek(seekTime) {
        this.seekTime = seekTime
    }

    @action pause() {
        this.isPlaying = false
    }

    @action onUpdate({ duration, buffered, currentTime }) {
        this.duration = duration
        this.buffered = buffered
        this.currentTime = currentTime
    }

    @action toggleMute() {
        this.isMuted = !this.isMuted
    }

    @action toggleFullsceen() {
        this.isFullscreen = !this.isFullscreen
    }
}

// class RemoteOutput extends OutputDevice {
//     isLocal() { return false }
// }

class LastPosition {
    @observable files = []
    @observable currentIndex = 0
    currentTime = 0
}

class PlayerStore {
    @observable output = new LocalOutput()
    @observable lastPosition = new LastPosition()

    constructor() {
        autorun(() => {

        }, { delay: 1000 })

        //resotre state
    }

    @action setOutput(output) {
        const prevOutput = this.output

        this.output = output

        const { files, fileIndex } = this.lastPosition
        this.output.setUrl(files[fileIndex].url)

        //respore prev output stat
        if (prevOutput) {
            if (prevOutput.isPlaying) {
                output.play(prevOutput.position)
            }
            prevOutput.disconnect()
        }
        output.connect()
    }

    @action play(files, fileName) {
        this.lastPosition.files = files
        
        let fileIndex = files.findIndex((file) => file.name == fileName)
        if(fileIndex == -1) fileName = 0

        this.switchFile(fileIndex)
        this.output.play()
    }

    @action.bound switchFile(fileIndex) {
        const { files } = this.lastPosition
        
        if(fileIndex < 0 || fileIndex >= files.length)
            return

        this.lastPosition.currentIndex = fileIndex
        this.output.setUrl(files[fileIndex].url)
        this.output.play()
    }

    @action.bound prevFile() {
        this.switchFile(this.lastPosition.currentIndex-1)
    }

    @action.bound nextFile() {
        this.switchFile(this.lastPosition.currentIndex+1)
    }
}

export default new PlayerStore()
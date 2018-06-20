import { observable, action } from 'mobx'


class OutputDevice {
    @observable files = []
    @observable currentFileIndex = 0
    @observable currentTime = 0
    @observable duration = 0
    @observable buffered = 0
    @observable isPlaying = false

    isSeekable() {
        return true
    }
    isLocal() {
        return true
    }

    /* eslint-disable no-unused-vars */
    setSource(source) { }
    pause() { }
    play(currentTime) { }
    seek(currentTime) { }
    connect(onDisconnect) { }
    disconnect() { }
    /* eslint-enable */

    setFiles(files) {
        this.files = files
    }

    selectFile(fileIndex) {
        this.currentFileIndex = fileIndex
        this.setSource(this.files[this.currentFileIndex].source)
    }
}

class LocalOutput extends OutputDevice {
    @observable volume = 1
    @observable isMuted = false
    @observable isFullscreen = false
    @observable url = null
    @observable hls = false
    @observable seekTime = null

    @action setVolume(volume) {
        this.volume = volume
    }

    @action setSource(source) {
        if (source.url != this.url) {
            this.url = source.url
            this.hls = source.hls
            this.currentTime = 0
        }
    }

    @action play(currentTime) {
        this.isPlaying = true
        if (currentTime != undefined) {
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

class PlayerStore {
    @observable output = null
    torrent = null

    @action loadOutput(output) {
        const prevOutput = this.output
        if (prevOutput) {
            prevOutput.disconnect()
        }

        this.output = output
    }

    @action switchOutput(output) {
        const prevOutput = this.output

        this.output = output

        const { files, fileIndex } = this.prevOutput

        this.output.setFiles(files)
        this.output.selectFile(fileIndex)

        //response prev output stat
        if (prevOutput) {
            if (prevOutput.isPlaying) {
                output.play(prevOutput.position)
            }
            prevOutput.disconnect()
        }
        output.connect()
    }

    @action play(files, fileName, torrent) {
        if(files.length === 0) return

        if(!this.output)
            this.output = new LocalOutput()

        this.torrent = torrent
        this.output.setFiles(files)

        let fileIndex = files.findIndex((file) => file.name == fileName)
        if (fileIndex == -1) fileName = 0

        this.output.selectFile(fileIndex)
        this.output.play()
    }

    @action.bound switchFile(fileIndex) {
        const { files } = this.output

        if (fileIndex < 0 || fileIndex >= files.length)
            return

        this.output.selectFile(fileIndex)
        this.output.play()
    }

    @action.bound prevFile() {
        this.switchFile(this.output.currentFileIndex - 1)
    }

    @action.bound nextFile() {
        this.switchFile(this.output.currentFileIndex + 1)
    }

    @action stopPlayng() {
        
    }

    @action stopPlayningTorrent(torrent) {

    }
}

export default new PlayerStore()
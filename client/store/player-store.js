import remoteControl from './remote-control'
import { observable, action } from 'mobx'
import request from 'superagent'

const testMedia = document.createElement('video')

export class Device {
    @observable playlist = { name: '', files: [] }
    @observable currentFileIndex = 0
    @observable currentTime = 0
    @observable duration = 0
    @observable buffered = 0
    @observable isPlaying = false
    @observable isLoading = false
    @observable error = null
    @observable volume = 1
    @observable isMuted = false

    isSeekable() {
        return true
    }

    isLocal() {
        return true
    }

    /* eslint-disable no-unused-vars */
    setSource(source) { }
    resume() { }
    pause() { }
    play(currentTime) { }
    seek(currentTime) { }
    connect() { }
    disconnect() { }
    setVolume(volume) {}
    selectFile(fileIndex) {}
    setPlaylist(playlist, fileIndex) {} 
    /* eslint-enable */
}

export class LocalDevice extends Device {
    @observable url = null
    keepAliveUrl = null
    @observable hls = false
    @observable seekTime = null

    keepAliveInterval = 0

    constructor() {
        super()
        this.keepAliveInterval= setInterval(() => {
            if(this.keepAliveUrl) {
                request.get(this.keepAliveUrl).end()
            }
        }, 5000) // each 5 sec call server keep alive
    }

    @action setSource(source) {
        if (source.url != this.url) {
            this.hsl = false
            this.keepAliveUrl = null
            
            //determinate best option
            if(source.mimeType && testMedia.canPlayType(source.mimeType)) {
                this.url = source.url
            } else if(source.hlsUrl) {
                this.url = source.hlsUrl
                this.keepAliveUrl = source.keepAliveUrl
                this.hls = true
            } else {
                this.url = source.url
            }

            this.currentTime = 0
            this.duration = 0
            this.buffered = 0
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

    @action resume() {
        this.isPlaying = true
    }

    @action pause() {
        this.isPlaying = false
    }

    @action onUpdate({ duration, buffered, currentTime }) {
        this.duration = duration
        this.buffered = buffered
        this.currentTime = currentTime
    }

    @action setPlaylist(playlist, fileIndex) {
        this.playlist = playlist
        this.selectFile(fileIndex)
    }

    @action selectFile(fileIndex) {
        const { files } = this.playlist
        this.currentFileIndex = fileIndex
        this.setSource(files[this.currentFileIndex])
    }

    @action setLoading(loading) {
        this.isLoading = loading
    }

    @action setError(error) {
        this.error = error
    }

    @action setVolume(volume) {
        this.volume = volume
    }

    @action toggleMute() {
        this.isMuted = !this.isMuted
    }

    connect() {
        remoteControl.setAvailability(true)
    }

    disconnect() {
        clearInterval(this.keepAliveInterval)
        remoteControl.setAvailability(false)
    }
}

class PlayerStore {
    @observable device = null
    torrent = null

    @action loadDevice(device) {
        const prevDevice = this.device
        if (prevDevice) {
            prevDevice.disconnect()
        }

        this.device = device
        this.device.connect()
    }

    @action switchDevice(device) {
        const prevDevice = this.device

        this.device = device

        const { playlist, fileIndex } = this.prevDevice

        this.device.setPlaylist(playlist, fileIndex)

        //response prev device stat
        if (prevDevice) {
            if (prevDevice.isPlaying) {
                device.play(prevDevice.position)
            }
            prevDevice.disconnect()
        }
        device.connect()
    }

    @action openPlaylist(device, playlist, fileIndex, torrent) {
        if(playlist.files.length === 0) return

        this.torrent = torrent

        const prevDevice = this.device
        if(prevDevice) prevDevice.disconnect()

        this.device = device
        this.device.connect()
        this.device.setPlaylist(playlist, fileIndex)
        this.device.play()
    }

    @action.bound switchFile(fileIndex) {
        const { playlist: { files } } = this.device

        if (fileIndex < 0 || fileIndex >= files.length)
            return

        this.device.selectFile(fileIndex)
        this.device.play()
    }

    @action.bound prevFile() {
        this.switchFile(this.device.currentFileIndex - 1)
    }

    @action.bound nextFile() {
        this.switchFile(this.device.currentFileIndex + 1)
    }

    @action closePlaylist() {
        if(this.device) {
            this.device.disconnect()
        }
        this.device = null
    }

    @action closeTorrent(torrent) {
        if(this.torrent && this.torrent.infoHash === torrent.infoHash) {
            this.closePlaylist()
        }
    }

    getPlayerTitle() {
        const { playlist: { name, files }, currentFileIndex } = this.device

        if(name && files)
            return name + (currentFileIndex != -1 ?  ' - ' + files[currentFileIndex].name : '')
    }
}

export default new PlayerStore()
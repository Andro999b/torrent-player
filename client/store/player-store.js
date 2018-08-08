import { observable, action } from 'mobx'
import request from 'superagent'


class Device {
    @observable playlist = []
    @observable currentFileIndex = 0
    @observable currentTime = 0
    @observable duration = 0
    @observable buffered = 0
    @observable isPlaying = false
    @observable isLoading = false
    @observable error = null

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

    @action setPlaylist(playlist) {
        this.playlist = playlist
    }

    @action selectFile(fileIndex) {
        const { files } = this.playlist
        this.currentFileIndex = fileIndex
        this.setSource(files[this.currentFileIndex].source)
    }

    @action setLoading(loading) {
        this.isLoading = loading
    }

    @action setError(error) {
        this.error = error
    }
}

export class LocalDevice extends Device {
    @observable volume = 1
    @observable isMuted = false
    @observable url = null
    keepAliveUrl = null
    @observable hls = false
    @observable seekTime = null

    keepAliveInterval = 0

    constructor() {
        super()
        this.keepAliveInterval= setInterval(() => {
            if(this.keepAliveUrl) {
                request.get(this.keepAliveUrl).end()// TODO more oblios way to do this
            }
        }, 5000) // each 5 sec call server keep alive
    }

    @action setVolume(volume) {
        this.volume = volume
    }

    @action setSource(source) {
        if (source.url != this.url) {
            this.url = source.url
            this.hls = source.hls
            this.keepAliveUrl = source.keepAliveUrl
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

    disconnect() {
        clearInterval(this.keepAliveInterval)
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
    }

    @action switchDevice(device) {
        const prevDevice = this.device

        this.device = device

        const { playlist, fileIndex } = this.prevDevice

        this.device.setPlaylist(playlist)
        this.device.selectFile(fileIndex)

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
        this.device = device
        this.device.setPlaylist(playlist)
        this.device.selectFile(fileIndex)
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
}

export default new PlayerStore()
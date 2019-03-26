import remoteControl from './remote-control'
import { request } from '../utils/api'
import { observable, action } from 'mobx'
import localStore from 'store'

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
    @observable seekTime = null
    @observable source = null
    @observable progress = null

    constructor() {
        super()
        this.volume = localStore.get('volume') || 1
    }

    @action setSource(source) {
        this.source = source
        this.currentTime = source.currentTime || 0
        this.duration = 0
        this.buffered = 0
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
        if(duration) this.duration = duration
        if(buffered) this.buffered = buffered
        if(currentTime) {
            this.currentTime = currentTime
            this.source.currentTime = currentTime
        }
    }

    @action setPlaylist(playlist, fileIndex) {
        this.playlist = playlist
        this.selectFile(fileIndex)
        this.play()

        //check progress
        if(playlist.torrentInfoHash) {
            this.clearProgressInterval()
            this.progressInterval = setInterval(() => {
                request
                    .get(`/api/torrents/${playlist.torrentInfoHash}/progress`)
                    .then((res) => {
                        this.progress = res.body
                        const { downloaded, length } = this.progress
                        if(downloaded == length) {
                            this.clearProgressInterval()
                        }
                    })
            }, 2000)
        }
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
        localStore.set('volume', volume)
    }

    @action toggleMute() {
        this.isMuted = !this.isMuted
    }

    clearProgressInterval() {
        if(this.progressInterval) {
            clearInterval(this.progressInterval)
        }
    }

    connect() {
        remoteControl.setAvailability(true)
    }

    disconnect() {
        this.clearProgressInterval()
        remoteControl.setAvailability(false)
    }
}

class PlayerStore {
    @observable device = null

    @action loadDevice(device) {
        const prevDevice = this.device
        if (prevDevice) prevDevice.disconnect()

        this.device = device
        this.device.connect()
    }

    @action openPlaylist(device, playlist, fileIndex) {
        if(playlist.files.length === 0) return

        const prevDevice = this.device
        if(prevDevice) prevDevice.disconnect()

        this.device = device
        this.device.connect()
        this.device.setPlaylist(playlist, fileIndex)
    }

    @action.bound seekIncremetal(inc) {
        const { device } = this
        if(device && device.duration) {
            const { currentTime, duration } = device
            let seekTime = currentTime + inc

            if(seekTime < 0) seekTime = 0
            else if(seekTime > duration) seekTime = duration

            device.seek(seekTime)
        }
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

    getPlayerTitle() {
        const { playlist: { name, files }, currentFileIndex } = this.device

        if(name && files)
            return name + (files.length > 1 ? ' - ' + (files[currentFileIndex].index + 1) : '')
    }
}

export default new PlayerStore()
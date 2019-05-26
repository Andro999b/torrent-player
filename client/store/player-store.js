import remoteControl from './remote-control'
import { request } from '../utils/api'
import { observable, action } from 'mobx'
import { END_FILE_TIME_OFFSET } from '../constants'
import localStore from 'store'
import filesize from 'file-size'

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
    setVolume(volume) { }
    selectFile(fileIndex) { }
    setPlaylist(playlist, fileIndex) { }
    /* eslint-enable */

    skip(sec) {
        if (this.duration) {
            const seekTime = this.currentTime + sec
            this.seek(Math.min(Math.max(seekTime, 0), this.duration))
        }
    }
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
            this.seekTime = currentTime
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
        if (duration) this.duration = duration
        if (buffered) this.buffered = buffered
        if (currentTime) {
            this.currentTime = currentTime

            if (this.duration) {
                const timeLimit = Math.max(0, this.duration - END_FILE_TIME_OFFSET)
                this.source.currentTime = Math.min(currentTime, timeLimit)
            }
        }
    }

    @action setPlaylist(playlist, fileIndex) {
        this.playlist = playlist
        this.selectFile(fileIndex)
        this.play()

        //check progress
        if (playlist.torrentInfoHash) {
            this.clearProgressInterval()
            this.progressInterval = setInterval(() => {
                request
                    .get(`/api/torrents/${playlist.torrentInfoHash}/progress`)
                    .then((res) => {
                        this.progress = res.body
                        const { downloaded, length } = this.progress
                        if (downloaded == length) {
                            this.clearProgressInterval()
                        }
                    })
            }, 2000)
        }
    }

    @action selectFile(fileIndex) {
        const { files } = this.playlist

        if (fileIndex < 0 || fileIndex >= files.length)
            return

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
        if (this.progressInterval) {
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
        if (playlist.files.length === 0) return

        const prevDevice = this.device
        if (prevDevice) prevDevice.disconnect()

        this.device = device
        this.device.connect()
        this.device.setPlaylist(playlist, fileIndex)
    }

    @action.bound switchFile(fileIndex) {
        this.device.selectFile(fileIndex)
        this.device.play()
    }

    @action.bound prevFile() {
        this.switchFile(this.device.currentFileIndex - 1)
    }

    @action.bound nextFile() {
        this.switchFile(this.device.currentFileIndex + 1)
    }

    @action.bound endFile() {
        const  {currentFileIndex, playlist: { files }} = this.device
        if(currentFileIndex == files.length - 1) {
            this.device.pause()
        } else {
            this.switchFile(this.device.currentFileIndex + 1)
        }
    }

    @action closePlaylist() {
        if (this.device) {
            this.device.disconnect()
        }
        this.device = null
    }

    getPlayerTitle() {
        const {
            playlist: { name, files },
            currentFileIndex
        } = this.device

        const progress = this.formatProgress()

        if (name && files) {
            return name +
                (files.length > 1 ? ` - ${currentFileIndex + 1} / ${files.length}` : '') +
                (progress ? ` - ${progress}` : '')
        }
    }

    formatProgress() {
        const { progress } = this.device

        if(!progress) return ''

        return `
            ${filesize(progress.downloaded).human()} /
            ${filesize(progress.length).human()}
            (Peers: ${progress.numPeers})
        `
    }
}

export default new PlayerStore()
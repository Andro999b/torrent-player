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
    @observable audioTracks = []
    @observable audioTrack = null
    @observable shuffle = false
    @observable seekTime = null
    
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
    setPlaylist(playlist, fileIndex, marks) { }
    setShuffle(shuffle) { }
    setAudioTrack(id) { }
    setAudioTracks(audioTracks) { }
    /* eslint-enable */

    @action.bound seeking(seekTime) {
        this.seekTime = seekTime
    }

    skip(sec) {
        if (this.duration) {
            const seekTo = this.currentTime + sec
            this.seek(Math.min(Math.max(seekTo, 0), this.duration))
        }
    }
}

export class LocalDevice extends Device {
    @observable url = null
    @observable seekTo = null
    @observable source = null
    @observable progress = null
    @observable marks = {}

    constructor() {
        super()
        this.volume = localStore.get('volume') || 1
        this.shuffle = localStore.get('shuffle') || false
    }

    @action.bound setSource(source) {
        this.source = source
        this.currentTime = this.marks[source.id] || source.currentTime || 0
        this.duration = 0
        this.buffered = 0
        this.audioTrack = null
        this.audioTracks = []

        if(source.mediaMetadataUrl) {
            request
                .get(source.mediaMetadataUrl)
                .then((res) => {
                    const { body: { streams } } = res
                    const audioTracks = []
                    streams.forEach(({ index, codec_type }) => {
                        if(codec_type === 'audio') {
                            audioTracks.push({
                                id: index,
                                name: `Track ${index}`
                            })
                        }
                    })
                    this.audioTracks = audioTracks
                })
        }
    }

    @action.bound play(currentTime) {
        this.isPlaying = true
        if (currentTime != undefined) {
            this.currentTime = currentTime
            this.seekTo = currentTime
            this.seekTime = null
        }
    }

    @action.bound seek(seekTo) {
        this.seekTo = seekTo
        this.seekTime = null
    }

    @action.bound resume() {
        this.isPlaying = true
    }

    @action.bound pause() {
        this.isPlaying = false
    }

    @action.bound onUpdate({ duration, buffered, currentTime }) {
        if (duration) this.duration = duration
        if (buffered) this.buffered = buffered
        if (currentTime) {
            this.currentTime = currentTime

            if (this.duration) {
                const timeLimit = Math.max(0, this.duration - END_FILE_TIME_OFFSET)
                const newMark = { [this.source.id]: Math.min(currentTime, timeLimit) }
                this.marks = { ...this.marks, ...newMark}
            }
        }
    }

    @action.bound setPlaylist(playlist, fileIndex, marks) {
        this.playlist = playlist
        this.marks = marks || {}
        this.selectFile(fileIndex || 0)
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

    @action.bound selectFile(fileIndex) {
        const { files } = this.playlist

        if (fileIndex < 0 || fileIndex >= files.length)
            return false

        this.currentFileIndex = fileIndex
        this.setSource(files[this.currentFileIndex])

        return true
    }

    @action.bound setLoading(loading) {
        this.isLoading = loading
    }

    @action.bound setError(error) {
        this.error = error
    }

    @action.bound setVolume(volume) {
        this.volume = volume
        localStore.set('volume', volume)
    }

    @action.bound setAudioTrack(id) {
        this.audioTrack = id
    }

    @action.bound setAudioTracks(audioTracks) { 
        this.audioTracks = audioTracks 
    }

    @action.bound setShuffle(shuffle) { 
        this.shuffle = shuffle 
        localStore.set('shuffle', shuffle)
    }

    @action.bound toggleMute() {
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

    @action openPlaylist(device, playlist, fileIndex, marks) {
        if (playlist.files.length === 0) return

        const prevDevice = this.device
        if (prevDevice) prevDevice.disconnect()

        this.device = device
        this.device.connect()
        this.device.setPlaylist(playlist, fileIndex, marks)
        document.title = this.getPlayerTitle()
    }

    @action.bound switchFile(fileIndex) {
        if(this.device.selectFile(fileIndex)){
            this.device.play()
        } else {
            this.device.pause()
        }
        document.title = this.getPlayerTitle()
    }

    @action.bound prevFile() {
        this.switchFile(this.device.currentFileIndex - 1)
    }

    @action.bound nextFile() {
        this.switchFileOrShuffle(this.device.currentFileIndex + 1)
    }

    @action.bound switchFileOrShuffle(fileIndex) {
        const { currentFileIndex, shuffle, playlist } = this.device
        const { files } = playlist

        if(files.length > 1 && shuffle) {
            let next
            
            do{
                next = Math.round(Math.random() * (files.length - 1))
            } while(next == currentFileIndex)
            
            this.device.selectFile(next)
        } else {
            this.device.selectFile(fileIndex)
        }

        this.device.play()
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
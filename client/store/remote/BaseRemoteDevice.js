import { Device } from '../player-store'
import { action } from 'mobx'
import pick from 'lodash.pick'
import { ALLOWED_REMOTE_STATE_FIELDS } from '../../constants'

export default class BaseRemoteDevice extends Device {
    resume() {
        this.sendAction('resume')
    }

    pause() {
        this.sendAction('pause')
    }

    play(currentTime) {
        this.sendAction('play', currentTime)
        if(currentTime != null) {
            this.currentTime = currentTime
            this.seekTime = null
            console.trace('play', currentTime)
        }
    }

    @action seek(currentTime) {
        this.currentTime = currentTime
        this.seekTime = null
        this.sendAction('seek', currentTime)
        console.trace('seek', currentTime)
    }

    @action setVolume(volume) {
        this.volume = volume
        this.sendAction('setVolume', volume)
    }

    toggleMute() {
        this.sendAction('toggleMute')
    }

    setAudioTrack(id) {
        this.sendAction('setAudioTrack', id)
    }

    setShuffle(shuffle) { 
        this.sendAction('setShuffle', shuffle)
    }

    selectFile(fileIndex) {
        this.sendAction('selectFile', fileIndex)
    }

    @action setPlaylist(playlist, fileIndex, marks) {
        this.playlist = playlist
        this.currentFileIndex = fileIndex
        this.sendAction('openPlaylist', { playlist, fileIndex, marks })
    }

    
    @action.bound onSync(state) {
        const filteredState = pick(state, ALLOWED_REMOTE_STATE_FIELDS)
        Object.keys(filteredState).forEach((key) => {
            this[key] = state[key]
        })
    }
}
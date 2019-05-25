import React from 'react'

import { observer } from 'mobx-react'
import ReactMPV from './ReactMPV'
import BaseScrean from './BaseScrean'
import { createExtractorUrlBuilder } from '../utils'

@observer
class MPVScrean extends BaseScrean {
    componentDidMount() {
        super.componentDidMount()

        const { device } = this.props
        device.setLoading(true)
    }

    onPlayPause(isPlaying) {
        this.mpv.property('pause', !isPlaying)
    }

    onSeek(seekTime) {
        this.mpv.property('time-pos', seekTime)
    } 

    onMute(isMuted) {
        this.mpv.property('ao-mute', isMuted)
    }

    onVolume(volume) {
        this.mpv.property('ao-volume', volume * 100)
    }

    onSource({ url, fsPath, extractor}, startTime = 0) {
        const { mpv, props: { device } } = this
        const { volume, isMute } = device

        device.setLoading(true)

        const options = `start=${startTime},volume=${volume * 100},mute=${ isMute? 'yes': 'no' }` 
        let path = fsPath
        
        if(!path) {
            path = location.protocol + '//' + location.host
            if(extractor) {
                path += createExtractorUrlBuilder(extractor)(url)
            } else {
                path += url
            }
        }

        mpv.property('hwdec', 'auto')
        mpv.command('loadfile', path, 'replace', options)
        mpv.property('pause', false)
    } 
    
    handleMPVReady = (mpv) => {
        const { device } = this.props
        const { source, currentTime, volume } = device

        this.mpv = mpv

        const observe = mpv.observe.bind(mpv)

        observe('pause')
        observe('time-pos')
        observe('duration')
        observe('eof-reached')

        this.onSource(source, currentTime)

        mpv.property('ao-volume', volume * 100)
    }

    handlePropertyChange = (name, value) => {
        const { onEnded, device } = this.props

        switch(name) {
            case 'time-pos': 
                device.onUpdate({ currentTime: value })
                break
            case 'duration': 
                device.setLoading(false)
                device.onUpdate({ duration: value })
                break
            case 'eof-reached':
                if(value) onEnded()
                break
        }
    }

    render() {
        return (
            <ReactMPV
                className="player__player-screen" 
                onReady={this.handleMPVReady}
                onPropertyChange={this.handlePropertyChange}
            />
        )
    }
}

export default MPVScrean
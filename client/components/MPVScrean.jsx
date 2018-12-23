import React from 'react'

import { observer } from 'mobx-react'
import ReactMPV from './ReactMPV'
import BaseScrean from './BaseScrean'

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

    onSource(source, startTime=0) {
        const { mpv, props: { device } } = this

        device.setLoading(true)

        if(source.fsPath) {
            mpv.command('loadfile', 
                source.fsPath, 
                'replace', 
                `start=${startTime},video-sync=display-resample` 
            )
        } else {
            mpv.command('loadfile', 
                location.protocol + '//' + location.host + source.url, 
                'replace', 
                `start=${startTime},video-sync=display-resample` 
            )
        }

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
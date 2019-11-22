import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    FastForwardRounded as FastForwardIcon,
    FastRewindRounded as FastRewindIcon,
    PlayCircleFilled as PlayIcon 
} from '@material-ui/icons'

import { observer } from 'mobx-react'

@observer
class PlayBackZones extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            seekMode: null
        }
    }

    handleFastFroward = (e) => {
        this.startSeeking(e, 'ff')
    }

    handleFastRewind = (e) => {
        this.startSeeking(e, 'fr')
    }

    startSeeking = (e, seekMode) =>  {
        e.stopPropagation()

        this.cleanUp()

        window.addEventListener('touchend', this.handleSeekEnd)
        window.addEventListener('touchmove', this.handlePreventScroll, { passive: false })
        window.addEventListener('touchcancel', this.handleSeekEnd)
        window.addEventListener('mouseup', this.handleSeekEnd)

        const { device } = this.props

        device.seeking(device.currentTime)
        device.pause()

        const { currentTime } = device

        this.lastTs = Date.now()
        this.accTime = 0

        this.setState({
            seekMode,
            time: currentTime
        },() => {
            this.stepInterval = setInterval(this.seekStep, 100)
        })
    }

    handlePreventScroll(e) {
        if(e.cancelable) {
            e.preventDefault()
            e.stopImmediatePropagation()
        }
    }

    handleSeekEnd = () => {
        const { device } = this.props

        device.play(this.targetTime)

        this.setState({
            seekMode: null,
        })

        this.targetTime = null
        this.lastTs = null

        this.cleanUp()
    }

    seekStep = () => {
        const timestamp = Date.now()
        const progress = (timestamp - this.lastTs) / 1000

        let seekSpeed = 15
        if(this.accTime > 120) {
            seekSpeed = 60
        } else if(this.accTime > 30) {
            seekSpeed = 30
        }

        const newAccTime = this.accTime + Math.floor(progress * seekSpeed)

        const { seekMode } = this.state
        const { device: { currentTime, duration, seeking } } = this.props
        const targetTime = seekMode == 'ff' ? currentTime + newAccTime : currentTime - newAccTime

        if(targetTime < 0 || targetTime > duration) {
            clearInterval(this.stepInterval)
            return
        }

        this.accTime = newAccTime
        this.lastTs = timestamp
        this.targetTime = targetTime

        seeking(targetTime)
    }

    componentWillUnmount() {
        this.cleanUp()
    }

    cleanUp() {
        window.removeEventListener('touchend', this.handleSeekEnd)
        window.removeEventListener('touchmove', this.handlePreventScroll)
        window.removeEventListener('touchcancel', this.handleSeekEnd)
        window.removeEventListener('mouseup', this.handleSeekEnd)
        clearInterval(this.stepInterval)
    }

    render() {
        const { seekMode } = this.state
        const { device: { isPlaying, isLoading }, onClick } = this.props

        return (
            <div 
                className={`player__pause-zone ${(isPlaying || isLoading) ? '' : 'player__pause-cover'}`}
                onMouseDown={onClick}
            >
                <div
                    className="playback-skip backward"
                    onTouchStart={this.handleFastRewind}
                    onMouseDown={this.handleFastRewind}
                />
                <div className="playback-skip__indicator">
                    {seekMode == 'fr' && <FastRewindIcon className="center" fontSize="inherit" />}
                    {seekMode == 'ff' && <FastForwardIcon className="center" fontSize="inherit"/>}
                    {(!seekMode && !isPlaying) && <PlayIcon className="center" fontSize="inherit"/>}
                </div>
                <div
                    className="playback-skip forward"
                    onTouchStart={this.handleFastFroward}
                    onMouseDown={this.handleFastFroward}
                />
            </div>
        )
    }
}

PlayBackZones.propTypes = {
    device: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
}

export default PlayBackZones
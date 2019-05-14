import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@material-ui/core'
import {
    FastForwardRounded as FastForwardIcon,
    FastRewindRounded as FastRewindIcon
} from '@material-ui/icons'

import { toHHMMSS } from '../utils'

class PlayBackSkipZones extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            seekMode: null,
            time: null
        }
    }

    handleFastFroward = () => {
        this.startSeeking('ff')
    }

    handleFastRewind = () => {
        this.startSeeking('fr')
    }

    startSeeking = (seekMode) =>  {
        this.cleanUp()
        
        window.addEventListener('touchend', this.handleSeekEnd)
        window.addEventListener('touchcancel', this.handleSeekEnd)
        window.addEventListener('mouseup', this.handleSeekEnd)

        const { device, onSeekStart } = this.props

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

        if(onSeekStart) onSeekStart()
    }

    handleSeekEnd = () => {
        const { device, onSeekEnd } = this.props
        const { time } = this.state

        device.play(time)

        this.setState({
            seekMode: null,
            time: null
        })
        this.lastTs = null

        this.cleanUp()
        if(onSeekEnd) onSeekEnd()
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
        const { device: { currentTime, duration } } = this.props
        const targetTime = seekMode == 'ff' ? currentTime + newAccTime : currentTime - newAccTime

        if(targetTime < 0 || targetTime > duration) {
            clearInterval(this.stepInterval)
            return
        }

        this.accTime = newAccTime
        this.lastTs = timestamp

        this.setState({
            time: targetTime
        })
    }

    componentWillUnmount() {
        this.cleanUp()
    }

    cleanUp() {
        window.removeEventListener('touchend', this.handleSeekEnd)
        window.removeEventListener('touchcancel', this.handleSeekEnd)
        window.removeEventListener('mouseup', this.handleSeekEnd)
        clearInterval(this.stepInterval)
    }

    render() {
        const { seekMode, time } = this.state

        return (
            <div className="shadow-border">
                <div 
                    className="playback-skip backward" 
                    onTouchStart={this.handleFastRewind}
                    onMouseDown={this.handleFastRewind}
                >
                    {seekMode == 'fr' && <FastRewindIcon className="center" />}
                </div>
                {time &&
                    <Typography variant="h4" className="center">
                        {toHHMMSS(time)}
                    </Typography>
                }
                <div 
                    className="playback-skip forward" 
                    onTouchStart={this.handleFastFroward}
                    onMouseDown={this.handleFastFroward}
                >
                    {seekMode == 'ff' && <FastForwardIcon className="center" />}
                </div>
            </div>
        )
    }
}

PlayBackSkipZones.propTypes = {
    device: PropTypes.object.isRequired,
    onSeekStart: PropTypes.func,
    onSeekEnd: PropTypes.func,
}

export default PlayBackSkipZones
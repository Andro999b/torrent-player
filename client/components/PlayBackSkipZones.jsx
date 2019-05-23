import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    FastForwardRounded as FastForwardIcon,
    FastRewindRounded as FastRewindIcon
} from '@material-ui/icons'

class PlayBackSkipZones extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            seekMode: null
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
        window.addEventListener('touchmove', this.handlePreventScroll, { passive: false })
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

    handlePreventScroll(e) {
        if(e.cancelable) {
            e.preventDefault()
            e.stopImmediatePropagation()
        }
    }

    handleSeekEnd = () => {
        const { device, onSeekEnd } = this.props

        device.play(this.targetTime)

        this.setState({
            seekMode: null,
        })

        this.targetTime = null
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
        const { device: { currentTime, duration }, onSeekTime } = this.props
        const targetTime = seekMode == 'ff' ? currentTime + newAccTime : currentTime - newAccTime

        if(targetTime < 0 || targetTime > duration) {
            clearInterval(this.stepInterval)
            return
        }

        this.accTime = newAccTime
        this.lastTs = timestamp
        this.targetTime = targetTime

        if(onSeekTime) onSeekTime(targetTime)
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

        const { onSeekTime } = this.props
        if(onSeekTime) onSeekTime(null)
    }

    render() {
        const { seekMode } = this.state

        return (
            <div className="shadow-border">
                <div
                    className="playback-skip backward"
                    onTouchStart={this.handleFastRewind}
                    onMouseDown={this.handleFastRewind}
                >
                    {seekMode == 'fr' && <FastRewindIcon className="center" />}
                </div>
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
    onSeekTime: PropTypes.func
}

export default PlayBackSkipZones
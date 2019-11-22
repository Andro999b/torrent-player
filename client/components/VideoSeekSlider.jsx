import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { toHHMMSS, isMobile } from '../utils'

class VideoSeekSlider extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            trackWidth: 0
        }
    }

    componentDidMount() {
        this.setTrackWidthState()
        window.addEventListener('resize', this.setTrackWidthState)
    }

    componentWillUnmount() {
        this.cleanUp()
    }

    setTrackWidthState = () => {
        if(this.track) {
            this.setState({ trackWidth: this.track.offsetWidth })
        }
    };

    handleStartSeek = () => {
        window.addEventListener('pointerleave', this.handleSeekEnd)
        window.addEventListener('touchcancel', this.handleSeekEnd)
        window.addEventListener('pointerup', this.handleSeekEnd)
        window.addEventListener('mousemove', this.handleSeeking)
        window.addEventListener('touchmove', this.handleTouchSeeking, { passive: false})
    }

    cleanUp() {
        window.removeEventListener('pointerleave', this.handleSeekEnd)
        window.removeEventListener('pointercancel', this.handleSeekEnd)
        window.removeEventListener('pointerup', this.handleSeekEnd)
        window.removeEventListener('mousemove', this.handleSeeking)
        window.removeEventListener('touchmove', this.handleTouchSeeking)
    }

    handleSeeking = (e) => {
        const seekTo = this.calcTime(e)

        this.props.onSeekTime(seekTo)
    }

    handleTouchSeeking = (e) => {
        if(e.cancelable) {
            e.preventDefault()
            e.stopImmediatePropagation()
        }

        const seekTo = this.calcTime(e)

        this.props.onSeekEnd(seekTo)
    }

    handleSeekEnd = (e) => {
        this.cleanUp()

        const { onSeekTime, onSeekEnd } = this.props
        const seekTo = this.calcTime(e)

        onSeekTime(null)
        onSeekEnd(seekTo)
    }

    handleStartHover = (e) => {
        const hoverTime = this.calcTime(e)

        this.props.onSeekTime(hoverTime)
    }

    handleEndHover = () => {
        this.props.onSeekTime(null)
    }

    calcTime(e) {
        const { trackWidth } = this.state
        const { duration } = this.props

        let posx
        if(e.touches) {
            posx = e.touches[0].pageX
        } else {
            posx = e.pageX
        }

        const position = posx - this.track.getBoundingClientRect().left
        return duration * (position / trackWidth)
    }

    getPositionStyle(time, duration) {
        if(time) {
            return { transform: 'scaleX(' + (time / duration) + ')' }
        } else {
            return { transform: 'scaleX(0)' }
        }
    }

    render() {
        const { buffered, currentTime, duration, seekTime } = this.props

        return (
            <div className="ui-video-seek-slider">
                <div
                    className={seekTime != null ? 'track active' : 'track'}
                    ref={(ref) => this.track = ref}
                    onPointerDown={this.handleStartSeek}
                    onMouseMove={isMobile() ? null : this.handleStartHover}
                    onMouseLeave={isMobile() ? null : this.handleEndHover}
                >
                    <div className="main">
                        <div className="buffered" style={this.getPositionStyle(buffered, duration)} />
                        <div className="connect" style={this.getPositionStyle(currentTime, duration)} />
                        { seekTime != null && <div className="seek-hover" style={this.getPositionStyle(seekTime, duration)} /> }
                        <div className="time-indicator shadow-border" >{seekTime?toHHMMSS(seekTime):toHHMMSS(currentTime)} / {toHHMMSS(duration)}</div>
                    </div>
                </div>
            </div>
        )
    }
}

VideoSeekSlider.defaultProps = {
    duration: 100,
    currentTime: 0,
    buffered: 0
}

VideoSeekSlider.propTypes = {
    buffered: PropTypes.number,
    duration: PropTypes.number,
    currentTime: PropTypes.number,
    seekTime: PropTypes.number,
    onSeekTime: PropTypes.func.isRequired,
    onSeekEnd: PropTypes.func.isRequired,
}

export default VideoSeekSlider
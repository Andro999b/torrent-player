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

    setTrackWidthState = () => {
        if(this.track) {
            this.setState({ trackWidth: this.track.offsetWidth })
        }
    };

    handleSeekEnd = (e) => {
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

        const time = (seekTime != null && seekTime < currentTime) ? seekTime : currentTime

        return (
            <div className="ui-video-seek-slider">
                <div
                    className={seekTime != null ? 'track active' : 'track'}
                    ref={(ref) => this.track = ref}
                    onPointerDown={this.handleSeekEnd}
                    onMouseMove={isMobile() ? null : this.handleStartHover}
                    onMouseLeave={isMobile() ? null : this.handleEndHover}
                >
                    <div className="main">
                        <div className="buffered" style={this.getPositionStyle(buffered, duration)} />
                        <div className="connect" style={this.getPositionStyle(time, duration)} />
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
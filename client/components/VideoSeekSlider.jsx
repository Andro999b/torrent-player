import React, { Component } from 'react'
import PropTypes from 'prop-types'

class VideoSeekSlider extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            trackWidth: 0,
            seekTime: null,
            hoverTime: null
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
        this.setState({ trackWidth: this.track.offsetWidth })
    };

    handleStartSeek = (e) => {
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
        const seekTime = this.calcTime(e)

        this.setState({ seekTime })
        this.props.onSeekTime(seekTime)
    }

    handleTouchSeeking = (e) => {
        if(e.cancelable) {
            e.preventDefault()
            e.stopImmediatePropagation()
        }

        const seekTime = this.calcTime(e)

        this.setState({ seekTime })
        this.props.onSeekTime(seekTime)
    }

    handleSeekEnd = (e) => {
        this.cleanUp()

        const { onSeekTime, onSeekEnd } = this.props
        const seekTime = this.calcTime(e)

        this.setState({ seekTime: null })
        onSeekTime(null)
        onSeekEnd(seekTime)
    }

    handleStartHover = (e) => {
        const hoverTime = this.calcTime(e)

        this.setState({ hoverTime })
        this.props.onSeekTime(hoverTime)
    }

    handleEndHover = () => {
        this.setState({ hoverTime: null })
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

    getThumbHandlerPosition(trackWidth, time, duration) {
        let position = trackWidth * (time / duration )
        return { transform: 'translateX(' + position + 'px)' }
    }

    render() {
        const { seekTime, hoverTime, trackWidth } = this.state
        const { buffered, currentTime, duration } = this.props

        const time = seekTime != null ? seekTime : currentTime

        return (
            <div className="ui-video-seek-slider">
                <div
                    className={seekTime != null ? 'track active' : 'track'}
                    ref={(ref) => this.track = ref}
                    onPointerDown={this.handleStartSeek}
                    onMouseMove={this.handleStartHover}
                    onMouseLeave={this.handleEndHover}
                >
                    <div className="main">
                        <div className="buffered" style={this.getPositionStyle(buffered, duration)} />
                        { seekTime == null && <div className="seek-hover" style={this.getPositionStyle(hoverTime, duration)} /> }
                        <div className="connect" style={this.getPositionStyle(time, duration)} />
                    </div>
                </div>

                <div 
                    className={seekTime != null ? 'thumb active' : 'thumb'} 
                    style={this.getThumbHandlerPosition(trackWidth, time, duration)}
                >
                    <div className="handler" />
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
    onSeekTime: PropTypes.func.isRequired,
    onSeekEnd: PropTypes.func.isRequired,
}

export default VideoSeekSlider
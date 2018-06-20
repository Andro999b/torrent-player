import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    CircularProgress,
    Typography
} from '@material-ui/core'

import ReactResizeDetector from 'react-resize-detector'
import { reaction } from 'mobx'
import { observer } from 'mobx-react'
import { invokeAll } from '../utils'
import Hls from 'hls.js'

@observer
class VideoScrean extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            startLoading: true,
            failed: false,
            videoScale: 'hor'
        }
    }

    handleLoadStart() {
        this.setState({ startLoading: true, failed: false })
    }

    handleError() {
        this.setState({ failed: true, startLoading: false })
    }

    handleLoadedMetadata() {
        this.handleUpdate()
        this.setState({
            startLoading: false,
            videoScale: this.getVideoScale()
        })
    }

    handleResize() {
        if (this.video) {
            this.setState({
                videoScale: this.getVideoScale()
            })
        }
    }

    getVideoScale() {
        const originAspect = this.video.videoWidth / this.video.videoHeight
        const containerAspect = this.container.clientWidth / this.container.clientHeight

        if (originAspect < containerAspect)
            return 'vert'

        return 'hor'
    }

    handleUpdate() {
        const { output } = this.props
        const { video: { buffered, duration, currentTime } } = this

        output.onUpdate({
            duration,
            buffered: buffered.length > 0 ? buffered.end(buffered.length - 1) : 0,
            currentTime
        })
    }

    handleEnded() {
        const { output, onEnded } = this.props

        output.pause()
        onEnded()
    }

    handleClick() {
        const { props: { output } } = this

        if (output.isPlaying) {
            output.pause()
        } else {
            output.play()
        }
    }

    componentDidMount() {
        if (this.video) {
            this.dispose = invokeAll(
                reaction(
                    () => this.props.output.isPlaying,
                    (isPlaying) => {
                        if (isPlaying) {
                            this.video.play()
                        } else {
                            this.video.pause()
                        }
                    }
                ),
                reaction(
                    () => this.props.output.seekTime,
                    (seekTime) => {
                        this.video.currentTime = seekTime
                    }
                ),
                reaction(
                    () => this.props.output.isMuted,
                    (isMuted) => {
                        this.video.muted = isMuted
                    }
                ),
                reaction(
                    () => this.props.output.url,
                    () => this.initVideo()
                )
            )
        }
        this.initVideo()
    }

    componentWillUnmount() {
        if (this.dispose) this.dispose()
    }

    initVideo() {
        const { video, props: { output } } = this

        if(this.hls) {
            const { hls } = this
            hls.stopLoad()
            hls.detachMedia()
        }

        const restoreVideoState = () => {
            video.currentTime = output.currentTime
            video.muted = output.isMuted
            if (output.isPlaying) {
                video.play()
            } else {
                video.pause()
            }
        }

        if (output.hls && Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(output.url)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => restoreVideoState())

            this.hls = hls
        } else {
            video.src = output.url
            restoreVideoState()
        }
    }

    render() {
        const { startLoading, failed, videoScale } = this.state

        return (
            <div className="player__player-screen" ref={(el) => this.container = el}>
                <ReactResizeDetector
                    skipOnMount
                    handleWidth
                    handleHeight
                    onResize={this.handleResize.bind(this)}
                />
                {failed && <Typography align="center" variant="display1">Can`t play media source</Typography>}
                {startLoading && <div className="loading-center"><CircularProgress /></div>}
                <video
                    className={`scale_${videoScale}`}
                    ref={(video) => this.video = video}
                    onDurationChange={this.handleUpdate.bind(this)}
                    onLoadedMetadata={this.handleLoadedMetadata.bind(this)}
                    onProgress={this.handleUpdate.bind(this)}
                    onTimeUpdate={this.handleUpdate.bind(this)}
                    onEnded={this.handleEnded.bind(this)}
                    onLoadStart={this.handleLoadStart.bind(this)}
                    onError={this.handleError.bind(this)}
                ></video>
            </div>
        )
    }
}

VideoScrean.propTypes = {
    output: PropTypes.object.isRequired,
    onEnded: PropTypes.func
}

export default VideoScrean
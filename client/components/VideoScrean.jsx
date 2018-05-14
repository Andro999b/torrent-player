import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { CircularProgress } from 'material-ui/Progress'
import Typography from 'material-ui/Typography'
import ReactResizeDetector from 'react-resize-detector'
import { reaction } from 'mobx'
import { observer } from 'mobx-react'
import { invokeAll } from '../utils'

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
        this.setState({ sfailed: true })
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
        output.onUpdate({
            duration: this.video.duration,
            buffered: this.video.buffered.length > 0 ? this.video.buffered.end(0) : 0,
            currentTime: this.video.currentTime
        })
    }

    handleEnded() {
        const { output, onEnded } = this.props

        output.pause()
        onEnded()
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
                )
            )
        }
    }

    componentWillUnmount() {
        if (this.dispose) this.dispose()
    }

    render() {
        const { output } = this.props
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
                {output.url &&
                    <video
                        className={`scale_${videoScale}`}
                        ref={(video) => {
                            this.video = video
                            if (video) {
                                video.currentTime = output.currentTime
                                video.muted = output.isMuted
                                if (output.isPlaying) {
                                    video.play()
                                } else {
                                    video.pause()
                                }
                            }
                        }}
                        onDurationChange={this.handleUpdate.bind(this)}
                        onLoadedMetadata={this.handleLoadedMetadata.bind(this)}
                        onProgress={this.handleUpdate.bind(this)}
                        onTimeUpdate={this.handleUpdate.bind(this)}
                        onEnded={this.handleEnded.bind(this)}
                        onLoadStart={this.handleLoadStart.bind(this)}
                        onError={this.handleError.bind(this)}
                    >
                        <source src={output.url} />
                    </video>
                }
            </div>
        )
    }
}

VideoScrean.propTypes = {
    output: PropTypes.object.isRequired,
    onEnded: PropTypes.func
}

export default VideoScrean
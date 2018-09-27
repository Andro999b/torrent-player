import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ReactResizeDetector from 'react-resize-detector'
import { reaction } from 'mobx'
import { observer } from 'mobx-react'
import { invokeAll, isTablet } from '../utils'
import Hls from 'hls.js'

@observer
class VideoScrean extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            videoScale: 'hor'
        }

        this.handleClick = this.handleClick
        this.handleKeyUp = this.handleKeyUp
    }

    handleLoadStart = () => {
        const { device } = this.props
        device.setLoading(true)
        device.setError(null)
    }

    handleError = (e) => {
        console.error(e.nativeEvent)
        const { device } = this.props
        device.setError('Could not play media')
        device.setLoading(false)
    }

    handleLoadedMetadata = () => {
        const { device } = this.props

        this.handleUpdate()
        this.setState({ videoScale: this.getVideoScale() })
        
        device.setError(null)
        device.setLoading(false)
    }

    handleResize = () => {
        if (this.video) {
            this.setState({
                videoScale: this.getVideoScale()
            })
        }
    }

    handleWaiting = () => {
        const { device } = this.props
        device.setLoading(true)
    }

    handlePlay= () => {
        const { device } = this.props
        device.setLoading(false)
    }


    getVideoScale() {
        const originAspect = this.video.videoWidth / this.video.videoHeight
        const containerAspect = this.container.clientWidth / this.container.clientHeight

        if (originAspect < containerAspect)
            return 'vert'

        return 'hor'
    }

    handleUpdate = () => {
        const { device } = this.props
        const { video: { buffered, duration, currentTime } } = this

        device.onUpdate({
            duration,
            buffered: buffered.length > 0 ? buffered.end(buffered.length - 1) : 0,
            currentTime
        })
    }

    handleEnded = () => {
        const { device, onEnded } = this.props

        device.pause()
        onEnded()
    }

    handleClick = () => {
        const { props: { device } } = this

        if (device.isPlaying) {
            device.pause()
        } else {
            device.play()
        }
    }

    handleKeyUp = (e) => {
        if(e.which == 32) { //spacebar
            this.handleClick()
        }
    }

    componentDidMount() {
        if (this.video) {
            this.disposeReactions = invokeAll(
                reaction(
                    () => this.props.device.isPlaying,
                    (isPlaying) => {
                        if (isPlaying) {
                            this.video.play()
                        } else {
                            this.video.pause()
                        }
                    }
                ),
                reaction(
                    () => this.props.device.seekTime,
                    (seekTime) => {
                        this.video.currentTime = seekTime
                    }
                ),
                reaction(
                    () => this.props.device.isMuted,
                    (isMuted) => {
                        this.video.muted = isMuted
                    }
                ),
                reaction(
                    () => this.props.device.url,
                    () => this.initVideo()
                )
            )
        }
        this.initVideo()
        this.attachListeners()
    }

    componentWillUnmount() {
        if (this.disposeReactions) {
            this.disposeReactions()
        }

        this.disposeHls()
        this.deattachListenrs()
    }

    disposeHls() {
        if(this.hls) {
            const { hls } = this
            hls.stopLoad()
            hls.detachMedia()
        }
    }

    initVideo() {
        const { video, props: { device } } = this

        this.disposeHls()

        const restoreVideoState = () => {
            video.currentTime = device.currentTime
            video.muted = device.isMuted
            if (device.isPlaying) {
                video.play()
            } else {
                video.pause()
            }
        }

        if (device.hls && Hls.isSupported()) {
            const hls = new Hls({
                startPosition: device.currentTime,
                xhrSetup: function(xhr) {
                    xhr.timeout = 0
                }
            })
            hls.loadSource(device.url)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => restoreVideoState())
            hls.on(Hls.Events.ERROR, (e) => {
                console.error('Hls playback error', e)
                //this.handleError()
            })

            this.hls = hls
        } else {
            video.src = device.url
            restoreVideoState()
        }
    }

    attachListeners() {
        window.addEventListener('keyup', this.handleKeyUp)
        if(!isTablet()) {
            this.video.addEventListener('click', this.handleClick)
        }
    }

    deattachListenrs() {
        window.removeEventListener('keyup', this.handleKeyUp)
        this.video.removeEventListener('click', this.handleClick)
    }

    render() {
        const { videoScale } = this.state

        return (
            <div className="player__player-screen" ref={(el) => this.container = el}>
                <ReactResizeDetector
                    skipOnMount
                    handleWidth
                    handleHeight
                    onResize={this.handleResize}
                />
                <video
                    className={`scale_${videoScale}`}
                    ref={(video) => this.video = video}
                    onDurationChange={this.handleUpdate}
                    onLoadedMetadata={this.handleLoadedMetadata}
                    onProgress={this.handleUpdate}
                    onTimeUpdate={this.handleUpdate}
                    onEnded={this.handleEnded}
                    onLoadStart={this.handleLoadStart}
                    onError={this.handleError}
                    onWaiting={this.handleWaiting}
                    onPlaying={this.handlePlay}
                ></video>
            </div>
        )
    }
}

VideoScrean.propTypes = {
    device: PropTypes.object.isRequired,
    onEnded: PropTypes.func
}

export default VideoScrean
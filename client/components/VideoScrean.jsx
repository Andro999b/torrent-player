import React, { Component } from 'react'
import PropTypes from 'prop-types'

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

    handleError = () => {
        const { device } = this.props
        device.setError('Could not play media')
        device.setLoading(false)
    }

    handleLoadedMetadata = () => {
        const { device } = this.props

        this.handleUpdate()
        this.handleResize()

        device.setError(null)
        device.setLoading(false)
    }

    handleResize = () => {
        this.video.className = `scale_${this.getVideoScale()}`
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

    componentDidMount() {
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
                (seekTime) => this.video.currentTime = seekTime
            ),
            reaction(
                () => this.props.device.isMuted,
                (isMuted) => this.video.muted = isMuted
            ),
            reaction(
                () => this.props.device.volume,
                (volume) => this.video.volume = volume
            ),
            reaction(
                () => this.props.device.url,
                () => this.initVideo()
            )
        )
        this.initVideo()
    }

    componentWillUnmount() {
        this.disposeReactions()
        this.disposeHls()
    }

    disposeHls() {
        if(this.hls) {
            this.hls.stopLoad()
            this.hls.detachMedia()
            this.hls.destroy()
        }
    }

    initVideo() {
        const { props: { device } } = this
        const video = this.createVideo()

        this.disposeHls()

        const restoreVideoState = () => {
            video.currentTime = device.currentTime
            video.muted = device.isMuted
            video.volume = device.volume
            if (device.isPlaying) {
                video.play()
            } else {
                video.pause()
            }
        }

        if (device.sourceType == 'hls' && Hls.isSupported()) {
            const hls = new Hls({
                startPosition: device.currentTime,
                xhrSetup: (xhr) => xhr.timeout = 0
            })
            
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => restoreVideoState())
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // try to recover network error
                            console.log('fatal network error encountered, try to recover') // eslint-disable-line 
                            hls.startLoad()
                            break
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('fatal media error encountered, try to recover') // eslint-disable-line
                            hls.recoverMediaError()
                            break
                        default:
                            // cannot recover
                            device.setError('Can`t play media')
                            hls.destroy()
                            break
                    }
                }
            })

            hls.loadSource(device.url)

            this.hls = hls
        } else {
            video.src = device.url
            restoreVideoState()
        }
    }

    createVideo() {
        if(this.video) {
            this.video.remove()
        }

        this.video = document.createElement('video')
        this.video.addEventListener('click', this.handleClick)
        this.video.addEventListener('durationchange', this.handleUpdate)
        this.video.addEventListener('loadedmetadata', this.handleLoadedMetadata)
        this.video.addEventListener('progress', this.handleUpdate)
        this.video.addEventListener('timeupdate', this.handleUpdate)
        this.video.addEventListener('ended', this.handleEnded)
        this.video.addEventListener('loadstart', this.handleLoadStart)
        this.video.addEventListener('waiting', this.handleWaiting)
        this.video.addEventListener('playing', this.handlePlay)
        this.video.addEventListener('error', this.handleError)
        
        this.container.append(this.video)

        return this.video
    }

    render() {
        return (
            <div className="player__player-screen" ref={(el) => this.container = el}>
                <ReactResizeDetector
                    skipOnMount
                    handleWidth
                    handleHeight
                    onResize={this.handleResize}
                />
            </div>
        )
    }
}

VideoScrean.propTypes = {
    device: PropTypes.object.isRequired,
    onEnded: PropTypes.func
}

export default VideoScrean
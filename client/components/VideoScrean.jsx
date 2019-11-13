import React from 'react'
import request from 'superagent'

import ReactResizeDetector from 'react-resize-detector'
import { observer } from 'mobx-react'
import Hls from 'hls.js'
import BaseScrean from './BaseScrean'
import { createExtractorUrlBuilder } from '../utils'

class HLSLoader extends Hls.DefaultConfig.loader {
    constructor(config) {
        super(config)

        const load = this.load.bind(this)

        let extractorUrlBuilder = null
        if (config.extractor) {
            extractorUrlBuilder = createExtractorUrlBuilder(config.extractor)
        }

        this.load = function (context, config, callbacks) {
            if (extractorUrlBuilder) {
                if (context.url.startsWith(window.location.origin)) { // replaces relative urls
                    const baseUrl = decodeURIComponent(context.frag.baseurl.split('&url=')[1])
                    context.url = new URL(context.frag.relurl, baseUrl).toString()
                }

                context.url = extractorUrlBuilder(context.url)
            }

            load(context, config, callbacks)
        }
    }
}

@observer
class VideoScrean extends BaseScrean {
    constructor(props, context) {
        super(props, context)

        this.state = {
            videoScale: 'hor'
        }
    }

    /**
     * lifecycle
     */
    componentDidMount() {
        super.componentDidMount()
        this.initVideo()
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.disposeHls()
    }

    /**
     *  reaction
     */

    onPlayPause(isPlaying) {
        if (isPlaying) {
            this.video.play()
        } else {
            this.video.pause()
        }
    }

    onSeek(seekTime) {
        this.video.currentTime = seekTime
    }

    onMute(isMuted) {
        this.video.muted = isMuted
    }

    onVolume(volume) {
        this.video.volume = volume
    }

    onSource() {
        this.initVideo()
    }

    onAudioTrack(trackId) {
        if(this.hls) {
            this.hls.audioTrack = trackId
        }
    }

    disposeHls() {
        if (this.hls) {
            this.hls.stopLoad()
            this.hls.detachMedia()
            this.hls.destroy()
        }
        this.hlsMode = false
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval)
        }
    }

    restoreVideoState = () => {
        const { video, props: { device } } = this

        video.currentTime = device.currentTime
        video.muted = device.isMuted
        video.volume = device.volume
        if (device.isPlaying) {
            video.play()
        } else {
            video.pause()
        }
    }

    initVideo() {
        const {
            props: {
                device: {
                    source: {
                        browserUrl,
                        url,
                        manifestUrl,
                        alternativeUrls 
                    }
                } 
            } 
        } = this

        this.alternativeUrls = alternativeUrls

        const { video } = this

        this.disposeHls()

        if (browserUrl) {
            video.src = browserUrl
        } else if (url) {
            this.setVideoSource(url)
        } else if (manifestUrl) {
            this.startHlsVideo()
        } else {
            const { device } = this.props

            device.setLoading(false)
            device.setError('No suitable video source')
            return
        }

        this.restoreVideoState()
    }

    setVideoSource(url) {
        const { props: { device: { source: { extractor } } } } = this
        const { video } = this

        if (extractor) {
            video.src = createExtractorUrlBuilder(extractor)(url)
        } else {
            video.src = url
        }
    }

    startHlsVideo() {
        this.hlsMode = true

        const { props: { device } } = this
        const { source } = device

        const hls = new Hls({
            startPosition: device.currentTime,
            xhrSetup: (xhr) => {
                xhr.timeout = 0
            },
            extractor: source.extractor,
            loader: HLSLoader
        })

        hls.attachMedia(this.video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.restoreVideoState()

            if(hls.audioTracks && hls.audioTracks.length > 1) {
                device.setAudioTracks(
                    hls.audioTracks.map(({id, name}) => ({id, name}))
                )
            }
        })
        hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
                switch (data.type) {
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

        hls.loadSource(source.manifestUrl)

        this.hls = hls
    }

    isHlsAvaliable() {
        const { props: { device: { source } } } = this

        return source.manifestUrl && Hls.isSupported()
    }

    keepHlsAlive() {
        const { props: { device: { source } } } = this

        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval)
        }

        this.keepAliveInterval = setInterval(() => {
            if (this.keepAliveUrl) {
                request.get(source.keepAliveUrl).end()
            }
        }, 5000) // each 5 sec call server keep alive
    }

    /**
     * event handlers
     */

    handleLoadStart = () => {
        const { device } = this.props
        device.setLoading(true)
        device.setError(null)
    }

    handleError = () => {
        const { props: { device }, alternativeUrls } = this

        if (alternativeUrls && alternativeUrls.length > 0) {
            this.setVideoSource(alternativeUrls.pop())
            this.restoreVideoState()
            return
        }

        if (!this.hlsMode && this.isHlsAvaliable()) { // retry with hls
            this.startHlsVideo()
            return
        }

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
        if (this.container) {
            this.video.className = `scale_${this.getVideoScale()}`
        }
    }

    handleWaiting = () => {
        const { device } = this.props
        device.setLoading(true)
    }

    handlePlay = () => {
        const { device } = this.props
        device.setLoading(false)
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

    getVideoScale() {
        const originAspectRatio = this.video.videoWidth / this.video.videoHeight
        const containerAspectRatio = this.container.clientWidth / this.container.clientHeight

        if (originAspectRatio < containerAspectRatio)
            return 'vert'

        return 'hor'
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
                <video
                    ref={(el) => this.video = el}
                    onDurationChange={this.handleUpdate}
                    onProgress={this.handleUpdate}
                    onTimeUpdate={this.handleUpdate}
                    onLoadedMetadata={this.handleLoadedMetadata}
                    onEnded={this.handleEnded}
                    onLoadStart={this.handleLoadStart}
                    onWaiting={this.handleWaiting}
                    onPlaying={this.handlePlay}
                    onError={this.handleError}
                />
            </div>
        )
    }
}

export default VideoScrean
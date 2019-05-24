import React from 'react'
import request from 'superagent'

import ReactResizeDetector from 'react-resize-detector'
import { observer } from 'mobx-react'
import Hls from 'hls.js'
import BaseScrean from './BaseScrean'

class HLSLoader extends Hls.DefaultConfig.loader {
    constructor(config) {
        super(config)

        const load = this.load.bind(this)
        
        let proxyBaseUrl = null
        if(config.proxy) {
            const { type, params } = config.proxy
            proxyBaseUrl = '/extractVideo?'
            proxyBaseUrl += `type=${type}`

            if(params) {
                Object.keys(params).forEach((key) => 
                    proxyBaseUrl += `&${key}=${params[key]}`
                )
            }
        }

        this.load = function (context, config, callbacks) {
            if(proxyBaseUrl) {
                if(context.url.startsWith(window.location.origin)) { // replaces rlative urls
                    const baseUrl = decodeURIComponent(context.frag.baseurl.split('&url=')[1])
                    context.url = new URL(context.frag.relurl, baseUrl).toString()
                }

                context.url = `${proxyBaseUrl}&url=${encodeURIComponent(context.url)}`
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

        this.handleClick = this.handleClick
        this.handleKeyUp = this.handleKeyUp
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
        const { props: { device: { source } } } = this
        const { video } = this

        this.disposeHls()

        const sourceUrl = source.browserUrl || source.url
        if (sourceUrl) {
            video.src = sourceUrl
        } else if (source.hlsUrl) {
            this.startHlsVideo()
        } else {
            const { device } = this.props

            device.setLoading(false)
            device.setError('No suitable video source')
            return
        }

        this.restoreVideoState()
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
            proxy: source.hlsProxy,
            loader: HLSLoader
        })

        hls.attachMedia(this.video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => this.restoreVideoState())
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

        hls.loadSource(source.hlsUrl)

        this.hls = hls
    }

    isHlsAvaliable() {
        const { props: { device: { source } } } = this

        return source.hlsUrl && Hls.isSupported()
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
        const { device } = this.props

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
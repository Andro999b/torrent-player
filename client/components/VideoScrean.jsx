import React from 'react'
import request from 'superagent'

import ReactResizeDetector from 'react-resize-detector'
import { observer } from 'mobx-react'
import Hls from 'hls.js'
import BaseScrean from './BaseScrean'

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
        if(this.hls) {
            this.hls.stopLoad()
            this.hls.detachMedia()
            this.hls.destroy()
        }
        this.hlsMode = false
        if(this.keepAliveInterval) {
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
        const { props: { device: { source }}} = this
        
        const video = this.createVideoElement()

        this.disposeHls()

        video.src = source.browserUrl || source.url
        this.restoreVideoState()
    }

    startHlsVideo() {
        this.hlsMode = true

        const { props: { device }} = this   
        const { source } = device

        const hls = new Hls({
            startPosition: device.currentTime,
            xhrSetup: (xhr) => xhr.timeout = 0
        })
        
        hls.attachMedia(this.video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => this.restoreVideoState())
        hls.on(Hls.Events.ERROR, (_, data) => {
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

        hls.loadSource(source.hlsUrl)

        this.hls = hls
    }

    isHlsAvaliable() {
        const { props: { device: { source } }} = this  

        return source.hlsUrl && Hls.isSupported()
    }

    keepHlsAlive() {
        const { props: { device: { source }}} = this    

        if(this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval)
        }

        this.keepAliveInterval = setInterval(() => {
            if(this.keepAliveUrl) {
                request.get(source.keepAliveUrl).end()
            }
        }, 5000) // each 5 sec call server keep alive
    }

    createVideoElement() {
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

        if(!this.hlsMode && this.isHlsAvaliable()) { // retry with hls
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
        this.video.className = `scale_${this.getVideoScale()}`
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
        const originAspect = this.video.videoWidth / this.video.videoHeight
        const containerAspect = this.container.clientWidth / this.container.clientHeight

        if (originAspect < containerAspect)
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
            </div>
        )
    }
}

export default VideoScrean
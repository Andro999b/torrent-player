import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Fullscreen from 'react-full-screen'

import MediaControls from './MediaControls'
import PlayerFilesList from './PlayerPlayList'
import PlayerTitle from './PlayerTitle'
import VideoScrean from './VideoScrean'
import MPVScrean from './MPVScrean'
import PlayBackZones from './PlayBackZones'
import ShowIf from './ShowIf'

import { Typography, CircularProgress } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

import { isTouchDevice, isElectron, hasArgv } from '../utils'

const IDLE_TIMEOUT = 3000

@inject('playerStore', 'transitionStore')
@observer
class LocalPlayer extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            playlistOpen: false,
            idle: false,
            fullScreen: false
        }

        this.handleActivity = this.handleActivity.bind(this)
    }

    handleCloseVideo = () => {
        const { transitionStore } = this.props
        transitionStore.stopPlayMedia()
    }

    handleTogglePlayList = () => {
        this.setState((prevState) => ({
            playlistOpen: !prevState.playlistOpen
        }))
    }


    handleClick = () => {
        const { props: { playerStore: { device } }, state: { idle }  } = this

        if (isTouchDevice() && idle) {
            this.handleActivity()
            return
        }

        if (device.isPlaying) {
            device.pause()
        } else {
            device.play()
        }
    }

    handleIdle = (idle) => {
        this.setState({ idle })
    }

    handleSelectFile = (fileIndex) => {
        const { playerStore } = this.props
        playerStore.switchFile(fileIndex)

        if (isTouchDevice()) this.setState({ playlistOpen: false })
    }

    handleToggleFullscreen = () => {
        const fullScreen = !this.state.fullScreen
        this.setState({ fullScreen })
    }

    handleSetFullScreen = (fullScreen) => {
        this.setState({ fullScreen })
        if (fullScreen) {
            if (isTouchDevice() && screen.orientation) {
                screen.orientation.lock('landscape')
            }
            this.setState({ idle: true })
        }
    }

    handleKeyUp = (e) => {
        const { props: { playerStore: { device } } } = this

        const step = e.ctrlKey ? 10 : (e.shiftKey ? 60 : 30)

        if (e.which == 32) { //spacebar
            if (device.isPlaying) {
                device.pause()
            } else {
                device.play()
            }
        } else if (e.which == 37) {
            device.skip(-step)
        } else if (e.which == 39) {
            device.skip(step)
        }
    }

    // --- idle checking ---
    handleActivity = () => {
        const { state: { idle }, idleTimeout } = this

        clearTimeout(idleTimeout)
        this.setIdleTimeout()

        if (idle) this.setState({ idle: false })
    }

    setIdleTimeout() {
        this.idleTimeout = setTimeout(
            () => this.setState({ idle: true }),
            IDLE_TIMEOUT
        )
    }

    componentWillUnmount() {
        const { idleTimeout } = this
        clearTimeout(idleTimeout);

        ['mousemove', 'mousedown', 'keydown', 'scroll'].forEach(
            (event) => window.removeEventListener(event, this.handleActivity)
        )

        window.removeEventListener('keyup', this.handleKeyUp)
    }

    componentDidMount() {
        this.setIdleTimeout()
        if (!isTouchDevice()) {
            ['mousemove', 'mousedown', 'keydown', 'scroll'].forEach(
                (event) => window.addEventListener(event, this.handleActivity)
            )

            window.addEventListener('keyup', this.handleKeyUp)
        }
    }
    // --- idle checking ---

    renderVideoSrean(device, onEnded) {
        const { source } = device

        const useMpv = isElectron() &&
            !hasArgv('no-mpv') &&
            source.preferMpv

        return useMpv ?
            <MPVScrean device={device} onEnded={onEnded} /> :
            <VideoScrean device={device} onEnded={onEnded} />
    }

    render() {
        const { playerStore } = this.props
        const { playlistOpen, idle, fullScreen } = this.state
        const { device } = playerStore
        const { isLoading, error, seekTime } = device

        const hideUi = idle && seekTime == null

        return (
            <Fullscreen
                enabled={fullScreen}
                onChange={this.handleSetFullScreen}
            >
                <div className={hideUi ? 'idle' : ''}>
                    <ShowIf mustNot={[hideUi]}>
                        <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
                    </ShowIf>
                    {this.renderVideoSrean(device, playerStore.endFile)}
                    <ShowIf must={[error]}>
                        <Typography className="center shadow-border" variant="h4">{error}</Typography>
                    </ShowIf>
                    <ShowIf mustNot={[error]}>
                        <ShowIf must={[isLoading]}>
                            <div className="center">
                                <CircularProgress color="secondary" />
                                <Typography variant="h5" className="shadow-border">
                                    {playerStore.formatProgress()}
                                </Typography>
                            </div>
                        </ShowIf>
                        <PlayBackZones device={device} onClick={this.handleClick} />
                        <ShowIf mustNot={[hideUi]}>
                            <PlayerFilesList
                                open={playlistOpen}
                                device={device}
                                onFileSelected={this.handleSelectFile}
                            />
                            <MediaControls
                                fullScreen={fullScreen}
                                device={device}
                                onNext={() => playerStore.nextFile()}
                                onPrev={() => playerStore.prevFile()}
                                onPlaylistToggle={this.handleTogglePlayList}
                                onFullScreenToggle={this.handleToggleFullscreen}
                            />
                        </ShowIf>
                    </ShowIf>
                </div>
            </Fullscreen >
        )
    }
}

LocalPlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default LocalPlayer
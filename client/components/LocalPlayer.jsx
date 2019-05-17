import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import Fullscreen from 'react-full-screen'

import MediaControls from './MediaControls'
import PlayerFilesList from './PlayerPlayList'
import PlayerTitle from './PlayerTitle'
import VideoScrean from './VideoScrean'
import MPVScrean from './MPVScrean'
import PlayBackSeekZones from './PlayBackSkipZones'

import { Typography, CircularProgress } from '@material-ui/core'
import { observer, inject } from 'mobx-react'
import filesize from 'file-size'

import { isMobile, isElectron, hasArgv } from '../utils'

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
        const { props: { playerStore: { device } } } = this

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

        if (isMobile()) this.setState({ playlistOpen: false })
    }

    handleToggleFullscreen = () => {
        const fullScreen = !this.state.fullScreen
        this.setState({ fullScreen })
    }

    handleSetFullScreen = (fullScreen) => {
        this.setState({ fullScreen })
        if (fullScreen) this.setState({ idle: true })
    }

    handleKeyUp = (e) => {
        const { props: { playerStore: { device } }} = this

        const step = e.ctrlKey ? 5 : (e.shiftKey ? 30 : 10)

        if(e.which == 32) { //spacebar
            if (device.isPlaying) {
                device.pause()
            } else {
                device.play()
            }
        } else if(e.which == 37) {
            device.skip(-step)
        } else if(e.which == 39) {
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

        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(
            (event) => window.removeEventListener(event, this.handleActivity)
        )

        window.removeEventListener('keyup', this.handleKeyUp)
    }

    componentDidMount() {
        this.setIdleTimeout();

        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(
            (event) => window.addEventListener(event, this.handleActivity)
        )

        window.addEventListener('keyup', this.handleKeyUp)
    }
    // --- idle checking ---

    render() {
        const { playerStore } = this.props
        const { playlistOpen, idle, fullScreen } = this.state
        const { device } = playerStore
        const { isLoading, error, source, progress } = device

        const useMpv = isElectron() && 
            !hasArgv('no-mpv') && 
            source.preferMpv

        return (
            <Fullscreen
                enabled={fullScreen}
                onChange={this.handleSetFullScreen}
            >
                <div className={idle ? 'idle': ''}>
                    { useMpv && <MPVScrean device={device} onEnded={playerStore.nextFile} /> }
                    { !useMpv && <VideoScrean device={device} onEnded={playerStore.nextFile} /> }
                    { isLoading && 
                        <div className="center">
                            <CircularProgress color="secondary"/>
                            {progress && <Typography variant="h5" className="shadow-border">
                                {filesize(progress.downloaded).human()}/{filesize(progress.length).human()}
                            </Typography>}
                        </div> 
                    }
                    { error && <Typography className="center" variant="h4">{error}</Typography> }
                    <div className="player__pause-zone" onMouseDown={this.handleClick}></div>
                    <PlayBackSeekZones device={device}/>
                    { (!idle) && (
                        <Fragment>
                            <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
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
                        </Fragment>
                    )}
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
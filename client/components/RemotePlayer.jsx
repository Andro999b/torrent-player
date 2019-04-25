import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import PlayBackSeekZones from './PlayBackSeekZones'

import { Typography, LinearProgress, Button } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

import { toHHMMSS } from '../utils'

@inject('playerStore', 'transitionStore')
@observer
class RemotePlayer extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            playlistOpen: true
        }
    }

    handleCloseVideo = () => {
        const { playerStore: { device }, transitionStore } = this.props
        device.closePlaylist()
        transitionStore.stopPlayMedia()
    }

    handleCloseDevice = () => {
        const { transitionStore } = this.props
        transitionStore.stopPlayMedia()
    }

    handleSelectFile = (fileIndex) => {
        const { playerStore } = this.props
        playerStore.switchFile(fileIndex)
    }

    handleTogglePlayList = () => {
        this.setState((prevState) => ({
            playlistOpen: !prevState.playlistOpen
        }))
    }

    handleTogglePlaying = () => {
        const { props: { playerStore: {device}}} = this

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
        window.addEventListener('keyup', this.handleKeyUp)
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeyUp)
    }

    render() {
        const { playlistOpen } = this.state
        const { playerStore, transitionStore } = this.props
        const { device } = playerStore
        const { isLoading, error, currentTime, duration, playlist: { image } } = device

        return (
            <div className="player__background-cover" style={{ backgroundImage: image ? `url(${image})` : 'none'}}>
                <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                    {error && <div>{error}</div>}
                    {!error && 
                        <div style={{ cursor: 'pointer' }} className="text-border" onClick={this.handleTogglePlaying}>
                            <div>{device.getName()}</div>
                            {isLoading && <div style={{padding: '18px 0 17px'}}>
                                <LinearProgress color="secondary" />
                            </div>}
                            {!isLoading && <div style={{whiteSpace: 'nowrap'}}>
                                {toHHMMSS(currentTime)} / {toHHMMSS(duration)}
                            </div>}
                        </div>
                    }
                    <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                </Typography>
                <Fragment>
                    <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
                    <PlayBackSeekZones playerStore={playerStore} />
                    <PlayerFilesList
                        open={playlistOpen}
                        device={device}
                        onFileSelected={this.handleSelectFile}
                    />
                    <MediaControls
                        device={device}
                        onNext={() => playerStore.nextFile()}
                        onPrev={() => playerStore.prevFile()}
                        onPlaylistToggle={this.handleTogglePlayList}
                        onFullScreenToggle={this.handleToggleFullscreen}
                    />
                </Fragment>
            </div>
        )
    }
}

RemotePlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default RemotePlayer
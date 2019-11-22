import React, { Component } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import PlayBackZones from './PlayBackZones'
import ShowIf from './ShowIf'

import { Typography, Button, CircularProgress } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

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
        device.closePlaylist(() => {
            transitionStore.stopPlayMedia()
        })
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

    handleClick = () => {
        const { props: { playerStore: { device } } } = this

        if (device.isPlaying) {
            device.pause()
        } else {
            device.play()
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
        const { playerStore } = this.props
        const { device } = playerStore
        const {
            isConnected,
            isLoading,
            error,
            playlist: { image }
        } = device

        return (
            <div 
                className="player__background-cover" 
                style={{ backgroundImage: image ? `url(${image})` : 'none' }}
            >
                <ShowIf must={[error]}>
                    <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                        <div className="shadow-border">{error}</div>
                        <Button variant="contained" onClick={this.handleCloseDevice}>Disconnect</Button>
                    </Typography>
                </ShowIf>
                <ShowIf must={[isLoading]}>
                    <div className="center">
                        <CircularProgress color="secondary" />
                    </div>
                </ShowIf>
                <ShowIf mustNot={[error]} must={[isConnected]}>
                    <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
                    <PlayBackZones device={device} onClick={this.handleClick}/>
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
                </ShowIf>
            </div>
        )
    }
}

RemotePlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default RemotePlayer
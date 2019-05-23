import React, { Component } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import PlayBackSkipZones from './PlayBackSkipZones'
import RemotePlaybackInfo from './RemotePlaybackInfo'
import ShowIf from './ShowIf'

import { Typography, Button } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

@inject('playerStore', 'transitionStore')
@observer
class RemotePlayer extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            playlistOpen: true,
            seekTime: null
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

    handleKeyUp = (e) => {
        if(e.which == 32) { //spacebar
            this.handleClick()
        }
    }

    handleSeekTime = (seekTime) => {
        this.setState({seekTime})
    }

    componentDidMount() {
        window.addEventListener('keyup', this.handleKeyUp)
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeyUp)
    }

    render() {
        const { playlistOpen, seekTime } = this.state
        const { playerStore } = this.props
        const { device } = playerStore
        const {
            isConnected,
            error,
            playlist: { image }
        } = device

        return (
            <div 
                className="player__background-cover" 
                style={{ backgroundImage: image ? `url(/proxyMedia?url=${encodeURIComponent(image)})` : 'none' }}
            >
                <ShowIf must={[error]}>
                    <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                        <div>{error}</div>
                        <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                    </Typography>
                </ShowIf>
                <ShowIf mustNot={[error]}>
                    <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                        <RemotePlaybackInfo device={device} seekTime={seekTime}/>
                        <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                    </Typography>
                </ShowIf>
                <ShowIf mustNot={[error]} must={[isConnected]}>
                    <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
                    <PlayBackSkipZones device={device} onSeekTime={this.handleSeekTime}/>
                    <PlayerFilesList
                        open={playlistOpen}
                        device={device}
                        onFileSelected={this.handleSelectFile}
                    />
                    <MediaControls
                        device={device}
                        onNext={() => playerStore.nextFile()}
                        onPrev={() => playerStore.prevFile()}
                        onSeekTime={this.handleSeekTime}
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
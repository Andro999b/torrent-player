import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import PlayBackSkipZones from './PlayBackSkipZones'
import RemotePlaybackInfo from './RemotePlaybackInfo'

import { Typography, Button } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

@inject('playerStore', 'transitionStore')
@observer
class RemotePlayer extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            playlistOpen: true,
            seeking: false
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

    handleStartSeek = () =>  {
        this.setState({ seeking: true })
    }

    handleEndSeek = () => {
        this.setState({ seeking: false })
    }

    componentDidMount() {
        window.addEventListener('keyup', this.handleKeyUp)
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeyUp)
    }

    render() {
        const { playlistOpen, seeking } = this.state
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
                {!seeking && 
                    <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                        {error && <div>{error}</div>}
                        {!error && <RemotePlaybackInfo device={device} />}
                        <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                    </Typography>
                }
                {isConnected &&
                    <Fragment>
                        <PlayerTitle title={playerStore.getPlayerTitle()} onClose={this.handleCloseVideo} />
                        <PlayBackSkipZones device={device} onSeekStart={this.handleStartSeek} onSeekEnd={this.handleEndSeek}/>
                        <PlayerFilesList
                            open={playlistOpen}
                            device={device}
                            onFileSelected={this.handleSelectFile}
                        />
                        {!seeking && <MediaControls
                            device={device}
                            onNext={() => playerStore.nextFile()}
                            onPrev={() => playerStore.prevFile()}
                            onPlaylistToggle={this.handleTogglePlayList}
                            onFullScreenToggle={this.handleToggleFullscreen}
                        />}
                    </Fragment>
                }
            </div>
        )
    }
}

RemotePlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default RemotePlayer
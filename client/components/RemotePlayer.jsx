import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import PlayBackSkipZones from './PlayBackSkipZones'
import RemotePlaybackInfo from './RemotePlaybackInfo'

import { Typography, Button } from '@material-ui/core'
import { observer, inject } from 'mobx-react'

import { toHHMMSS } from '../utils'

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
            playlist: { image },
            duration
        } = device

        return (
            <div 
                className="player__background-cover" 
                style={{ backgroundImage: image ? `url(/proxyMedia?url=${encodeURIComponent(image)})` : 'none' }}
            >
                {seekTime == null && 
                    <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                        {error && <div>{error}</div>}
                        {!error && <RemotePlaybackInfo device={device} />}
                        <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                    </Typography>
                }
                {(isConnected && !error) &&
                    <Fragment>
                        {seekTime != null && 
                            <Typography className="center shadow-border" align="center" variant="h4">
                                {toHHMMSS(seekTime)} / {toHHMMSS(duration)}
                            </Typography>
                        }
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
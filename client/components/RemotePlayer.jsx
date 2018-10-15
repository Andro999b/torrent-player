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
        transitionStore.goBack()
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

    render() {
        const { playlistOpen } = this.state
        const { playerStore } = this.props
        const { device } = playerStore
        const { isLoading, error, currentTime } = device

        return (
            <Fragment>
                <Typography className="center" align="center" variant="h4" style={{ width: '100%' }}>
                    {error && <div>{error}</div>}
                    {!error && <Fragment>
                        <div>{device.getName()}</div>
                        {isLoading && <div style={{padding: '17px 0'}}><LinearProgress color="secondary" /></div>}
                        {!isLoading && <div>{toHHMMSS(currentTime)}</div>}
                    </Fragment>}
                    <Button variant="contained" onClick={this.handleCloseDevice}>Close device</Button>
                </Typography>
                {!error && <Fragment>
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
                </Fragment>}
            </Fragment>
        )
    }
}

RemotePlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default RemotePlayer
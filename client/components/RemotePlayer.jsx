import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import MediaControls from './MediaControls'
import PlayerTitle from './PlayerTitle'
import PlayerFilesList from './PlayerPlayList'
import { isTablet } from '../utils'
import { Typography, CircularProgress } from '@material-ui/core'
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
        const { isLoading, error } = device

        const showTitle = !(isTablet() && playlistOpen)

        return (
            <Fragment>
                { isLoading && <div className="center"><CircularProgress /></div> }
                { error && <Typography className="center" variant="display1">{error}</Typography> }
                { showTitle && <PlayerTitle title={device.playlist.name} onClose={this.handleCloseVideo} /> }
                { !error && (
                    <Fragment>
                        { !isLoading && <Typography className="center" align="center" variant="display1">
                            Connected: <br/>
                            {device.getName()}
                        </Typography>}
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
                )}
            </Fragment>
        )
    }
}

RemotePlayer.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default RemotePlayer
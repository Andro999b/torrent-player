import React, { Component, Fragment } from 'react'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'
import Fullscreen from 'react-full-screen'
import Idle from 'react-idle'
import VideoControls from '../components/VideoControls'
import PlayerFilesList from '../components/PlayerFilesList'
import VideoScrean from '../components/VideoScrean'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

const IDLE_TIMEOUT = 5000

const playerTheme = (mainTheme) => createMuiTheme({
    palette: {
        primary: mainTheme.palette.primary,
        secondary: mainTheme.palette.secondary,
        type: 'dark',
    }
})


@inject('playerStore') @observer
class PlayerView extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            playlistOpen: false,
            idle: false
        }
    }

    handleTogglePlayList() {
        this.setState((prevState) => ({
            playlistOpen: !prevState.playlistOpen
        }))
    }

    handleIdle(idle) {
        this.setState({ idle })
    }

    render() {
        const { playerStore } = this.props

        if (!playerStore) return null

        const local = playerStore.output.isLocal()

        return (
            <MuiThemeProvider theme={playerTheme}>
                {local && this.renderLocal(playerStore)}
            </MuiThemeProvider>
        )
    }

    renderLocal(playerStore) {
        const output = playerStore.output
        const { playlistOpen, idle } = this.state
        const fullscreen = output.isFullscreen

        return (
            <Fullscreen
                enabled={fullscreen}
                onChange={(isFullscreen) => output.isFullscreen = isFullscreen}
            >
                <Idle timeout={IDLE_TIMEOUT} onChange={({ idle }) => this.handleIdle(idle)} />
                <div className="video-player__screen">
                    <VideoScrean output={output} onEnded={playerStore.nextFile} />
                    {(!idle || !fullscreen) && (
                        <Fragment>
                            <PlayerFilesList
                                open={playlistOpen}
                                lastPosition={playerStore.lastPosition}
                                onFileSelected={(fileIndex) => playerStore.switchFile(fileIndex)}
                            />
                            <VideoControls
                                output={playerStore.output}
                                onNext={() => playerStore.nextFile()}
                                onPrev={() => playerStore.prevFile()}
                                onPlaylistToggle={this.handleTogglePlayList.bind(this)}
                            />
                        </Fragment>
                    )}
                </div>
            </Fullscreen>
        )
    }
}

PlayerView.propTypes = {
    playerStore: PropTypes.object
}

export default PlayerView
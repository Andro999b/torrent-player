import React, { Component } from 'react'
import VideoSeekSlider from './VideoSeekSlider'
import '../video-slider.scss'
import PropTypes from 'prop-types'
import { Paper, IconButton, Slide } from '@material-ui/core'
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    SkipPrevious as PreviousIcon,
    SkipNext as NextIcon,
    List as ListIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon
} from '@material-ui/icons'
import SoundControl from './SoundControl'
import { isElectron } from '../utils'

import { observer } from 'mobx-react'

@observer
class MediaControls extends Component {
    render() {
        const {
            onPlaylistToggle,
            onFullScreenToggle,
            fullScreen,
            device,
            onPrev,
            onNext,
            onSeekTime
        } = this.props

        const showFullscrean = device.isLocal() && !isElectron()

        const {
            currentFileIndex,
            playlist: { files }
        } = device

        return (
            <Slide direction="up" in mountOnEnter unmountOnExit>
                <Paper elevation={0} square className="player-controls">
                    <VideoSeekSlider 
                        buffered={device.buffered}
                        currentTime={device.currentTime}
                        duration={device.duration}
                        onSeekEnd={(time) => device.seek(time)}
                        onSeekTime={onSeekTime}
                    />
                    <div className="player-controls__panel">
                        <div className="player-controls__panel-section">
                            { currentFileIndex != 0 && 
                                <IconButton onClick={onPrev}>
                                    <PreviousIcon />
                                </IconButton>
                            }
                            {!device.isPlaying &&
                                <IconButton onClick={() => device.resume()}>
                                    <PlayIcon />
                                </IconButton>
                            }
                            {device.isPlaying &&
                                <IconButton onClick={() => device.pause()}>
                                    <PauseIcon />
                                </IconButton>
                            }
                            { currentFileIndex < files.length - 1 &&
                                <IconButton onClick={onNext}>
                                    <NextIcon />
                                </IconButton>
                            }
                            <SoundControl device={device}/>
                        </div>
                        <div className="player-controls__panel-section">
                            {showFullscrean &&
                                <IconButton onClick={() => onFullScreenToggle()}>
                                    {!fullScreen && <FullscreenIcon />}
                                    {fullScreen && <FullscreenExitIcon />}
                                </IconButton>
                            }
                            <IconButton onClick={() => onPlaylistToggle()}>
                                <ListIcon />
                            </IconButton>
                        </div>
                    </div>
                </Paper>
            </Slide>
        )
    }
}

MediaControls.propTypes = {
    device: PropTypes.object.isRequired,
    onPlaylistToggle: PropTypes.func.isRequired,
    onFullScreenToggle: PropTypes.func,
    onSeekTime: PropTypes.func,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    fullScreen: PropTypes.bool,
}

export default MediaControls
import React, { Component, Fragment } from 'react'
import { VideoSeekSlider } from 'react-video-seek-slider'
import '../../node_modules/react-video-seek-slider/lib/ui-video-seek-slider.css'
import PropTypes from 'prop-types'
import { Paper, IconButton, Slide } from '@material-ui/core'
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    SkipPrevious as PreviousIcon,
    SkipNext as NextIcon,
    VolumeUp as VolumeOnIcon,
    VolumeOff as VolumeOffIcon,
    List as ListIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon
} from '@material-ui/icons'

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
            onNext
        } = this.props

        const local = device.isLocal()

        return (
            <Slide direction="up" in mountOnEnter unmountOnExit>
                <Paper elevation={0} square className="player-controls">
                    {
                        device.isSeekable() &&
                        <VideoSeekSlider
                            max={device.duration}
                            currentTime={device.currentTime}
                            progress={device.buffered}
                            onChange={(time) => device.seek(time)}
                            offset={0}
                            secondsPrefix="00:00:"
                            minutesPrefix="00:"
                        />
                    }
                    <div className="player-controls__panel">
                        <div className="player-controls__panel-section">
                            <IconButton onClick={onPrev}>
                                <PreviousIcon />
                            </IconButton>
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
                            <IconButton onClick={onNext}>
                                <NextIcon />
                            </IconButton>
                            <Fragment>
                                <IconButton onClick={() => device.toggleMute()}>
                                    {device.isMuted && <VolumeOffIcon />}
                                    {!device.isMuted && <VolumeOnIcon />}
                                </IconButton>
                            </Fragment>
                        </div>
                        <div className="player-controls__panel-section">
                            {local &&
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
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    fullScreen: PropTypes.bool,
}

export default MediaControls
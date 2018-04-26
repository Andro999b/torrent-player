import React, { Component, Fragment } from 'react'
import { VideoSeekSlider } from 'react-video-seek-slider'
import '../../node_modules/react-video-seek-slider/lib/video-seek-slider.css'
import PropTypes from 'prop-types'
import { Paper, IconButton } from 'material-ui'
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    SkipPrevious as PreviousIcon,
    SkipNext as NextIcon,
    VolumeUp as VolumeOnIcon,
    VolumeOff as VolumeOffIcon,
    Cast as CastIcon,
    List as ListIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon
} from 'material-ui-icons'

import { observer } from 'mobx-react'


@observer
class VideoControls extends Component {
    render() {
        const { onPlaylistToggle, output, onPrev, onNext } = this.props

        const local = output.isLocal()
        const volumeControls = local ?
            <Fragment>
                <IconButton onClick={() => output.toggleMute()}>
                    {output.isMuted && <VolumeOffIcon />}
                    {!output.isMuted && <VolumeOnIcon />}
                </IconButton>
            </Fragment> : null


        return (
            <Paper elevation={0} square className="player-controls">
                {
                    output.isSeekable() &&
                    <VideoSeekSlider
                        max={output.duration}
                        currentTime={output.currentTime}
                        progress={output.buffered}
                        onChange={(time) => output.seek(time)}
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
                        {!output.isPlaying &&
                            <IconButton onClick={() => output.play()}>
                                <PlayIcon />
                            </IconButton>
                        }
                        {output.isPlaying &&
                            <IconButton onClick={() => output.pause()}>
                                <PauseIcon />
                            </IconButton>
                        }
                        <IconButton onClick={onNext}>
                            <NextIcon />
                        </IconButton>
                        {volumeControls}
                    </div>
                    <div className="player-controls__panel-section">
                        {local &&
                            <IconButton onClick={() => output.toggleFullsceen()}>
                                {!output.isFullscreen && <FullscreenIcon />}
                                {output.isFullscreen && <FullscreenExitIcon />}
                            </IconButton>
                        }
                        <IconButton>
                            <CastIcon />
                        </IconButton>
                        <IconButton onClick={() => onPlaylistToggle()}>
                            <ListIcon />
                        </IconButton>
                    </div>
                </div>
            </Paper>
        )
    }
}

VideoControls.propTypes = {
    output: PropTypes.object.isRequired,
    onPlaylistToggle: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
}

export default VideoControls
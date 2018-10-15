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

import { observer } from 'mobx-react'

@observer
class VideoSeek extends Component {
    constructor(props, context) {
        super(props, context)
        
        this.state = {
            time: props.device.currentTime
        }
    }
    
    handleTimeChange = (time) => {
        this.setState({time})
    }
    
    handleEndSeek = () => {
        const { device } = this.props
        const { time } = this.state

        device.seek(time)
    }

    render() {
        const { device } = this.props
        const { time } = this.state

        return (
            <div style={{padding: '0px 10px'}}>
                <VideoSeekSlider
                    max={device.duration}
                    currentTime={time}
                    progress={device.buffered}
                    onChange={this.handleTimeChange}
                    onSeekEnd={this.handleEndSeek}
                    offset={0}
                    secondsPrefix="00:00:"
                    minutesPrefix="00:"
                />
            </div>
        )
    }
}

VideoSeek.propTypes = {
    device: PropTypes.object.isRequired
}

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
                    {device.isSeekable() && <VideoSeek device={device}/>}
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
                            <SoundControl device={device}/>
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
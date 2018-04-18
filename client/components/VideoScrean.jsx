import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { reaction } from 'mobx'
import { observer } from 'mobx-react'
import { invokeAll } from '../utils'

@observer
class VideoScrean extends Component {
    handleUpdate() {
        const { output } = this.props
        output.onUpdate({
            duration: this.video.duration,
            buffered: this.video.buffered.length > 0 ? this.video.buffered.end(0) : 0,
            currentTime: this.video.currentTime
        })
    }

    componentDidMount() {
        if (this.video) {
            this.dispose = invokeAll(
                reaction(
                    () => this.props.output.isPlaying,
                    (isPlaying) => {
                        if (isPlaying) {
                            this.video.play()
                        } else {
                            this.video.pause()
                        }
                    }
                ),
                reaction(
                    () => this.props.output.seekTime,
                    (seekTime) => {
                        this.video.currentTime = seekTime
                    }
                ),
                reaction(
                    () => this.props.output.isMuted,
                    (isMuted) => {
                        this.video.muted = isMuted
                    }
                )
            )
        }
    }

    componentWillUnmount() {
        if(this.dispose) this.dispose()
    }

    handleEnded() {
        const { output, onEnded } = this.props

        output.pause()
        onEnded()
    }

    render() {
        const { output } = this.props

        return (
            <div className="video-player__video-screen">
                {output.url &&
                    <video
                        ref={(video) => {
                            this.video = video
                            if (video) {
                                video.currentTime = output.currentTime
                                video.muted = output.isMuted
                                if (output.isPlaying) {
                                    video.play()
                                } else {
                                    video.pause()
                                }
                            }
                        }}
                        onDurationChange={this.handleUpdate.bind(this)}
                        onLoadedMetadata={this.handleUpdate.bind(this)}
                        onProgress={this.handleUpdate.bind(this)}
                        onTimeUpdate={this.handleUpdate.bind(this)}
                        onEnded={this.handleEnded.bind(this)}
                    >
                        <source src={output.url} />
                    </video>
                }
            </div>
        )
    }
}

VideoScrean.propTypes = {
    output: PropTypes.object.isRequired,
    onEnded: PropTypes.func
}

export default VideoScrean
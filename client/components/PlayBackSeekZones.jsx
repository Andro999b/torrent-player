import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

class PlayBackSeekZones extends Component {
    handleSeekFroward = () => {
        const { playerStore } = this.props
        playerStore.seekIncremetal(10)
    }

    handleSeekBackward = () => {
        const { playerStore } = this.props
        playerStore.seekIncremetal(-10)
    }

    handleClick = () => {
        const { props: { playerStore: { device } } } = this

        if (device.isPlaying) {
            device.pause()
        } else {
            device.play()
        }
    }

    render() {
        return (
            <Fragment>
                <div className="playback-seek__pause" onMouseDown={this.handleClick}></div>
                <div className="playback-seek backward" onClick={this.handleSeekBackward}></div>
                <div className="playback-seek forward" onClick={this.handleSeekFroward}></div>
            </Fragment>
        )
    }
}

PlayBackSeekZones.propTypes = {
    playerStore: PropTypes.object.isRequired
}

export default PlayBackSeekZones
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

class PlayBackSkipZones extends Component {
    handleSeekFroward = () => {
        const { device } = this.props
        device.skip(10)
    }

    handleSeekBackward = () => {
        const { device } = this.props
        device.skip(-10)
    }

    render() {
        return (
            <Fragment>
                <div className="playback-seek backward" onClick={this.handleSeekBackward}></div>
                <div className="playback-seek forward" onClick={this.handleSeekFroward}></div>
            </Fragment>
        )
    }
}

PlayBackSkipZones.propTypes = {
    device: PropTypes.object.isRequired
}

export default PlayBackSkipZones
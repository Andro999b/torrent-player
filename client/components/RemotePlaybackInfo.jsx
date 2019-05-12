import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { toHHMMSS } from '../utils'

import { LinearProgress } from '@material-ui/core'

class RemotePlaybackInfo extends Component {

    handleTogglePlaying = () => {
        const { props: { device } } = this

        if (device.isPlaying) {
            device.pause()
        } else {
            device.play()
        }
    }

    render() {
        const {
            device: {
                getName,
                isLoading,
                isConnected,
                currentTime,
                duration
            }
        } = this.props

        return (
            <div style={{ cursor: 'pointer' }} className="text-border" onClick={this.handleTogglePlaying}>
                <div>{getName()}</div>
                {isLoading &&
                    <div style={{padding: '18px 0 17px'}}>
                        <LinearProgress color="secondary" />
                    </div>
                }
                {isConnected &&
                    <div style={{whiteSpace: 'nowrap'}}>
                        {toHHMMSS(currentTime)} / {toHHMMSS(duration)}
                    </div>
                }
            </div>
        )
    }
}

RemotePlaybackInfo.propTypes = {
    device: PropTypes.object
}

export default RemotePlaybackInfo
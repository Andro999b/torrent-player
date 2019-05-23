import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { toHHMMSS } from '../utils'

import { LinearProgress } from '@material-ui/core'
import { observer } from 'mobx-react'
import ShowIf from './ShowIf'

@observer
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
            },
            seekTime
        } = this.props

        return (
            <div style={{ cursor: 'pointer' }} onClick={this.handleTogglePlaying}>
                <div className="shadow-border" >{getName()}</div>
                <ShowIf must={[isLoading]}>
                    <div style={{padding: '18px 0 17px'}}>
                        <LinearProgress color="secondary" />
                    </div>
                </ShowIf>
                <ShowIf must={[isConnected]}>
                    <div className="shadow-border" style={{whiteSpace: 'nowrap'}}>
                        {toHHMMSS(seekTime || currentTime)} / {toHHMMSS(duration)}
                    </div>
                </ShowIf>
            </div>
        )
    }
}

RemotePlaybackInfo.propTypes = {
    device: PropTypes.object,
    seekTime: PropTypes.number
}

export default RemotePlaybackInfo
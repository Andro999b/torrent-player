import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import { toHHMMSS } from '../utils'

import { LinearProgress } from '@material-ui/core'
import { observer } from 'mobx-react'

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
            }
        } = this.props

        return (
            <div style={{ cursor: 'pointer' }} className="remote-player__info" onClick={this.handleTogglePlaying}>
                <div>{getName()}</div>
                {isLoading &&
                    <div style={{padding: '18px 0 17px'}}>
                        <LinearProgress color="secondary" />
                    </div>
                }
                {isConnected &&
                    <div style={{whiteSpace: 'nowrap'}}>
                        {currentTime > 0 && toHHMMSS(currentTime)}
                        {duration > 0 &&
                            <Fragment>
                                &nbsp;/&nbsp;{toHHMMSS(duration)}
                            </Fragment>
                        }
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
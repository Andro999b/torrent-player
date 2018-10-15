import React, { Component, Fragment } from 'react'
import {
    VolumeUp as VolumeOnIcon,
    VolumeOff as VolumeOffIcon
} from '@material-ui/icons'
import { IconButton, Paper, Popover } from '@material-ui/core'
import Slider from '@material-ui/lab/Slider'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

@observer
class SoundControl extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            anchorEl: null
        }
    }

    handleVolumeChange = (_, value) => {
        const { device } = this.props
        device.setVolume(value)
    }

    handleCloseRequest = () => {
        this.setState({
            anchorEl: null
        })
    }

    toggleVolumeSlider = (event) => {
        const { currentTarget } = event
        this.setState((state) => ({
            anchorEl: state.anchorEl ? null : currentTarget
        }))
    }

    render() {
        const { device } = this.props
        const { anchorEl } = this.state

        return (
            <Fragment>
                <IconButton onClick={this.toggleVolumeSlider}>
                    {device.volume == 0 && <VolumeOffIcon />}
                    {device.volume > 0 && <VolumeOnIcon />}
                </IconButton>
                <Popover 
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    open={anchorEl != null}
                    onClose={this.handleCloseRequest}
                >
                    <Paper>
                        <div className="sound-conrol__slider">
                            <Slider max={1} value={device.volume} onChange={this.handleVolumeChange} />
                        </div>
                    </Paper>
                </Popover>
            </Fragment>
        )
    }
}

SoundControl.propTypes = {
    device: PropTypes.object.isRequired
}

export default SoundControl
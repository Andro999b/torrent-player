import React, { Component, Fragment } from 'react'
import {
    VolumeUpRounded as VolumeUpIcon,
    VolumeDownRounded as VolumeDownIcon,
    VolumeOffRounded as VolumeOffIcon
} from '@material-ui/icons'
import { 
    IconButton,
    Paper,
    Popover,
    Typography
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

const VOLUME_LEVELS = 15

@observer
class MobileSoundControl extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            anchorEl: null
        }
    }

    changeVolue(inc) {
        const { device } = this.props
        const newVolume = (Math.ceil(device.volume * VOLUME_LEVELS) + inc ) / VOLUME_LEVELS
        device.setVolume(Math.max(Math.min(newVolume, 1), 0))
    }

    handleVolumeUp = () => this.changeVolue(1)

    handleVolumeDown = () => this.changeVolue(-1)

    handleCloseRequest = () => {
        this.setState({
            anchorEl: null
        })
    }

    toggleVolumePopup = (event) => {
        const { currentTarget } = event
        this.setState((state) => ({
            anchorEl: state.anchorEl ? null : currentTarget
        }))
    }

    render() {
        const { device: { volume } } = this.props
        const { anchorEl } = this.state

        return (
            <Fragment>
                <IconButton onClick={this.toggleVolumePopup}>
                    {volume == 0 && <VolumeOffIcon />}
                    {volume > 0 && <VolumeUpIcon />}
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
                        <div className="sound-control__mobile">
                            <IconButton onClick={this.handleVolumeDown}>
                                <VolumeDownIcon/>
                            </IconButton>
                            <Typography variant="body2" align="center">
                                {Math.ceil(volume * VOLUME_LEVELS)}
                            </Typography>
                            <IconButton onClick={this.handleVolumeUp}>
                                <VolumeUpIcon/>
                            </IconButton>
                        </div>
                    </Paper>
                </Popover>
            </Fragment>
        )
    }
}

MobileSoundControl.propTypes = {
    device: PropTypes.object.isRequired
}

export default MobileSoundControl
import React, { Component, Fragment } from 'react'
import {
    VolumeUpRounded as VolumeUpIcon,
    VolumeDownRounded as VolumeDownIcon
} from '@material-ui/icons'
import { 
    Slider,
    IconButton
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'

@observer
class SoundControl extends Component {
    constructor(props, context) {
        super(props, context)
    }

    handleVolumDown = () => {
        this.props.device.setVolume(0)
    }

    handleVolumUp = () => {
        this.props.device.setVolume(1)
    }

    handleVolume = (_, volume) => {
        this.props.device.setVolume(volume / 100)
    }

    render() {
        const { device: { volume } } = this.props

        return (
            <Fragment>
                <IconButton onClick={this.handleVolumDown}>
                    <VolumeDownIcon/>
                </IconButton>
                <Slider className="sound-control__slider " value={volume * 100} onChange={this.handleVolume} />
                <IconButton onClick={this.handleVolumUp}>
                    <VolumeUpIcon/>
                </IconButton>
            </Fragment>
        )
    }
}

SoundControl.propTypes = {
    device: PropTypes.object.isRequired
}

export default SoundControl
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import {
    IconButton,
    Menu,
    MenuItem
} from '@material-ui/core'
import { AudiotrackRounded as AudioTrackIcon } from '@material-ui/icons'

@observer
class AudioTrackSelector extends Component {

    constructor(props, context) {
        super(props, context)
        this.state = { anchorEl: null }
    }

    handleClick =(event) => {
        this.setState({ anchorEl: event.currentTarget })
    }

    handleClose = () => {
        this.setState({ anchorEl: null })
    }

    selectTrack = (id) => {
        this.props.device.audioTrack = id
        this.setState({ anchorEl: null })
    }

    render() {
        const { anchorEl } = this.state
        const { audioTrack, audioTracks } = this.props.device

        return (
            <span>
                <IconButton onClick={this.handleClick}>
                    <AudioTrackIcon/>
                </IconButton>
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                >
                    {audioTracks.map(({id, name}) => (
                        <MenuItem key={id} selected={id == audioTrack} onClick={() => this.selectTrack(id)}>
                            {name}
                        </MenuItem>
                    ))}
                </Menu>
            </span>
        )
    }
}

AudioTrackSelector.propTypes = {
    device: PropTypes.object.isRequired
}

export default AudioTrackSelector
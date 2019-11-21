import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import {
    Button,
    Menu,
    MenuItem
} from '@material-ui/core'

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

        const selectedTrack = audioTrack != null && audioTracks.find(({ id }) => id == audioTrack)

        return (
            <span>
                <Button onClick={this.handleClick}>
                    {selectedTrack ? selectedTrack.name : 'Auto Track'}
                </Button>
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                >
                    {audioTracks.map(({id, name}) => (
                        <MenuItem key={id} onClick={() => this.selectTrack(id)}>
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
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Paper
} from '@material-ui/core'
import {
    PlayArrow as PlayableIcon,
    MoreVert as MoreIcon
} from '@material-ui/icons'

class ContinueWatchingItem extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = { anchorEl: null }
    }

    resumePlaying(playFun) {
        const { 
            item: { 
                playlist, 
                currentFileIndex, 
                currentTime 
            }
        } = this.props
        const { files } = playlist
        const file = files[currentFileIndex]
        
        playFun(playlist, file, currentTime)
    }

    handlePlay = () => this.resumePlaying(this.props.onPlay)
    handleCast = () => this.resumePlaying(this.props.onCast)
    handleClean = () => this.props.onClean(this.props.item)

    handleOpenMenu = (event) => this.setState({ anchorEl: event.currentTarget })
    handleCloseMenu = () => this.setState({ anchorEl: null })

    render() {
        const { item: { playlist, currentFileIndex }} = this.props
        const { anchorEl } = this.state
        const { name, files } = playlist
        const fileName = files[currentFileIndex].name

        return (
            <Paper square>
                <ListItem button onClick={this.handlePlay} ContainerComponent="div">
                    <ListItemIcon className="hide-on-mobile">
                        <PlayableIcon />
                    </ListItemIcon>
                    <ListItemText primary={name} secondary={fileName}/>
                    <ListItemSecondaryAction>
                        <IconButton onClick={this.handleOpenMenu}>
                            <MoreIcon />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={anchorEl != null} onClose={this.handleCloseMenu}>
                            {<MenuItem onClick={this.handleCast}>
                                Cast
                            </MenuItem>}
                            <MenuItem onClick={this.handleClean}>
                                Clean
                            </MenuItem>
                        </Menu>
                    </ListItemSecondaryAction>
                </ListItem>
            </Paper>
        )
    }
}

ContinueWatchingItem.propTypes = {
    item: PropTypes.object.isRequired,
    onPlay: PropTypes.func.isRequired,
    onCast: PropTypes.func.isRequired,
    onClean: PropTypes.func.isRequired
}

export default ContinueWatchingItem
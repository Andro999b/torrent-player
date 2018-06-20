import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem
} from '@material-ui/core'
import {
    PlayArrow as PlayableIcon,
    InsertDriveFile as NotPlayableIcon,
    MoreVert as MoreIcon
} from '@material-ui/icons'
import { grey } from '@material-ui/core/colors'
import { isPlayable, getTorrentFileContentLink } from '../utils'
import filesize from 'file-size'

class TorrentListItemFile extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = { anchorEl: null }
    }
    

    handleDownload() {
        const { torrent, fileIndex } = this.props
        const downloadUrl = getTorrentFileContentLink(torrent.infoHash, fileIndex)

        window.open(downloadUrl, '_blank')
    }


    handleOpenMenu(event) {
        this.setState({ anchorEl: event.currentTarget })
    }

    handleCloseMenu() {
        this.setState({ anchorEl: null })
    }

    render() {
        const { torrent, file, fileIndex, onPlayFile, onCastFile } = this.props
        const { anchorEl } = this.state

        const playable = isPlayable(file.name)
        const progress = file.progress > 1 ? '100%' : Math.ceil(Math.min(file.progress, 1) * 100) + '%'

        const text = <div style={{ wordBreak: 'break-all' }}>
            {file.name}&nbsp;
            <span style={{ color: grey[600] }}>
                {filesize(file.length).human()}&nbsp;{progress}
            </span>
        </div>

        return (
            <ListItem key={fileIndex} button={playable} onClick={() => onPlayFile(torrent, file.name)}>
                <ListItemIcon className="hide-on-mobile">
                    {playable ? <PlayableIcon /> : <NotPlayableIcon />}
                </ListItemIcon>
                <ListItemText primary={text} style={{ paddingLeft: 0 }} />
                <ListItemSecondaryAction>
                    <IconButton onClick={this.handleOpenMenu.bind(this)}>
                        <MoreIcon />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={anchorEl != null} onClose={this.handleCloseMenu.bind(this)}>
                        {playable && <MenuItem onClick={() => onCastFile(torrent, file.name)}>
                            Cast
                        </MenuItem>}
                        <MenuItem onClick={this.handleDownload.bind(this)}>
                            Download
                        </MenuItem>
                    </Menu>
                </ListItemSecondaryAction>
            </ListItem>
        )
    }
}

TorrentListItemFile.propTypes = {
    torrent: PropTypes.object.isRequired,
    file: PropTypes.object.isRequired,
    fileIndex: PropTypes.number.isRequired,
    onPlayFile: PropTypes.func.isRequired,
    onCastFile: PropTypes.func.isRequired,
}

export default TorrentListItemFile
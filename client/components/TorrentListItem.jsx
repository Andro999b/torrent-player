import React, { Component } from 'react'
import ExpansionPanel, { ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions } from 'material-ui/ExpansionPanel'
import ExpandIcon from 'material-ui-icons/ExpandMore'
import DownloadIcon from 'material-ui-icons/FileDownload'
import UploadIcon from 'material-ui-icons/FileUpload'
import DeleteIcon from 'material-ui-icons/Delete'
import IconButton from 'material-ui/IconButton'
import Button from 'material-ui/Button'
import List, { ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import Typography from 'material-ui/Typography'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { isPlayable, getTorrentFileContentLink } from '../utils'

import red from 'material-ui/colors/red'
import green from 'material-ui/colors/green'
import grey from 'material-ui/colors/grey'

import PlayableIcon from 'material-ui-icons/PlayArrow'
import NotPlayableIcon from 'material-ui-icons/InsertDriveFile'
import CastIcon from 'material-ui-icons/Cast'
import { inject } from 'mobx-react'

@inject(({ transitionStore }) => ({
    onPlayFile: transitionStore.playTorrent,
    onCastFile: transitionStore.castTorrent
}))
class TorrentListItem extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            showDetails: false
        }
    }

    handleToggleDetails() {
        this.setState((prevState) => ({ showDetails: !prevState.showDetails }))
    }

    renderFile(file, fileIndex) {
        const { torrent, onPlayFile, onCastFile } = this.props

        const playable = isPlayable(file.name)
        const progress = file.progress > 1 ? '100%' : Math.ceil(1 * 100) + '%'

        const text = <div style={{ wordBreak: 'break-all' }}>
            {file.name}&nbsp;
            <span style={{ color: grey[600] }}>
                {filesize(file.length).human()}&nbsp;{progress}
            </span>
        </div>

        return (
            <ListItem key={file.name} button={playable} onClick={() => onPlayFile(torrent, file.name)}>
                <ListItemIcon>
                    {playable ? <PlayableIcon /> : <NotPlayableIcon />}
                </ListItemIcon>
                <ListItemText primary={text} style={{ paddingLeft: 0 }} />
                <ListItemSecondaryAction>
                    {playable && <IconButton onClick={() => onCastFile(torrent, file.name)}>
                        <CastIcon />
                    </IconButton>}
                    <IconButton href={getTorrentFileContentLink(torrent.infoHash, fileIndex)} target="_blank">
                        <DownloadIcon />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
        )
    }

    render() {
        const { torrent, onDelete } = this.props
        const { showDetails } = this.state

        const subheader = (
            <div style={{ color: grey[600] }}>
                <span>
                    {filesize(torrent.downloaded).human()}
                    {torrent.downloadedSpeed && ` (${filesize(torrent.downloadedSpeed).human()}/sec)`}
                    <DownloadIcon style={{ verticalAlign: 'middle' }} />
                    &nbsp;
                </span>
                <span>
                    {filesize(torrent.uploaded).human()}
                    {torrent.uploadedSpeed && ` (${filesize(torrent.uploadedSpeed).human()}/sec)`}
                    <UploadIcon style={{ verticalAlign: 'middle' }} />
                    &nbsp;
                </span>
                {<span style={{ color: torrent.numPeers ? green[500] : red[700] }}>Pears: {torrent.numPeers}&nbsp;</span>}
            </div>
        )

        const title = (
            <div
                style={{ wordBreak: 'break-all' }}>
                {torrent.name}
            </div>
        )

        return (
            <ExpansionPanel expanded={showDetails} onChange={this.handleToggleDetails.bind(this)}>
                <ExpansionPanelSummary expandIcon={<ExpandIcon />} classes={{ content: 'expand-header' }}>
                    <Typography variant='title' className='expand-header__row'>{title}</Typography>
                    <Typography variant='subheading' className='expand-header__row'>{subheader}</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <List className="files-list">
                        {torrent.files.map(this.renderFile.bind(this))}
                    </List>
                </ExpansionPanelDetails>
                <ExpansionPanelActions>
                    <Button color="secondary" onClick={() => onDelete(torrent)} variant="raised">
                        Delete
                        <DeleteIcon />
                    </Button>
                </ExpansionPanelActions>
            </ExpansionPanel>
        )
    }
}

TorrentListItem.propTypes = {
    torrent: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    onPlayFile: PropTypes.func,
    onCastFile: PropTypes.func
}

export default TorrentListItem
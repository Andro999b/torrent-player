import React, { Component } from 'react'
import classnames from 'classnames'
import Card, { CardContent, CardHeader, CardActions } from 'material-ui/Card'
import ExpandIcon from 'material-ui-icons/ExpandMore'
import DownloadIcon from 'material-ui-icons/FileDownload'
import UploadIcon from 'material-ui-icons/FileUpload'
import DeleteIcon from 'material-ui-icons/Delete'
import IconButton from 'material-ui/IconButton'
import Button from 'material-ui/Button';
import List, { ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import Collapse from 'material-ui/transitions/Collapse'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { isPlayable } from '../utils'

import red from 'material-ui/colors/red'
import green from 'material-ui/colors/green'
import grey from 'material-ui/colors/grey'

import PlayableIcon from 'material-ui-icons/PlayArrow'
import NotPlayableIcon from 'material-ui-icons/InsertDriveFile'
import CastIcon from 'material-ui-icons/Cast'

class TorrentListItem extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            showDetails: false
        }
    }

    onToggleDetails() {
        this.setState((prevState) => ({ showDetails: !prevState.showDetails }))
    }

    renderFile(file) {
        const playable = isPlayable(file.name)
        const progress = file.progress > 1 ? '100%' : Math.ceil(1 * 100) + '%'
        const text = <div style={{ wordBreak: 'break-all' }}>
            {file.name}&nbsp;
            <span style={{ color: grey[600] }}>
                {filesize(file.length).human()}&nbsp;{progress}
            </span>
        </div>

        return (
            <ListItem key={file.name} button={playable} >
                <ListItemIcon>
                    {playable ? <PlayableIcon /> : <NotPlayableIcon />}
                </ListItemIcon>
                <ListItemText primary={text} style={{ paddingLeft: 0 }} />
                <ListItemSecondaryAction>
                    {playable && <IconButton>
                        <CastIcon />
                    </IconButton>}
                    <IconButton>
                        <DownloadIcon />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
        )
    }

    render() {
        const { torrent } = this.props
        const { showDetails } = this.state

        const subheader = (
            <div>
                <span><DownloadIcon style={{ verticalAlign: 'middle' }} />
                    {filesize(torrent.downloaded).human()}
                    {torrent.downloadedSpeed && ` (${filesize(torrent.downloadedSpeed).human()}/sec)`}
                    &nbsp;
                </span>
                <span><UploadIcon style={{ verticalAlign: 'middle' }} />
                    {filesize(torrent.uploaded).human()}
                    {torrent.uploadedSpeed && ` (${filesize(torrent.uploadedSpeed).human()}/sec)`}
                    &nbsp;
                </span>
                {<span style={{ color: torrent.numPeers ? green[500] : red[700] }}>Pears: {torrent.numPeers}&nbsp;</span>}
            </div>
        )

        return (
            <Card>
                <CardHeader
                    title={<div style={{ wordBreak: 'break-all' }}>{torrent.name}</div>}
                    subheader={subheader}
                    action={
                        <IconButton
                            onClick={this.onToggleDetails.bind(this)}
                            className={classnames('expand', { 'expandOpen': showDetails })}>
                            <ExpandIcon />
                        </IconButton>}
                >
                </CardHeader>
                <Collapse in={showDetails} unmountOnExit>
                    <CardContent>
                        <List className="files-list">
                            {torrent.files.map(this.renderFile)}
                        </List>
                    </CardContent>
                    <CardActions style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" color="secondary">
                            Delete torrent
                            <DeleteIcon />
                        </Button>
                    </CardActions>
                </Collapse>
            </Card>
        )
    }
}

TorrentListItem.propTypes = {
    torrent: PropTypes.object.isRequired,
}

export default TorrentListItem
import React, { Component } from 'react'

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    ExpansionPanelActions,
    Button,
    List,
    Typography
} from '@material-ui/core'
import {
    ExpandMore as ExpandIcon,
    FileDownload as DownloadIcon,
    FileUpload as UploadIcon,
    Delete as DeleteIcon
} from '@material-ui/icons'
import { red, green, grey } from '@material-ui/core/colors'
import TorrentListItemFile from './TorrentListItemFile'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { inject } from 'mobx-react'

@inject(({ transitionStore: { playMedia, castMedia } }) => ({
    onPlayFile: playMedia,
    onCastFile: castMedia
}))
class TorrentListItem extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            showDetails: false
        }
    }

    handleToggleDetails() {
        this.setState(({ showDetails }) => ({ showDetails: !showDetails }))
    }


    render() {
        const { torrent, onDelete, onCastFile, onPlayFile } = this.props
        const { showDetails } = this.state

        const subheader = (
            <div style={{ color: grey[600] }}>
                <span style={{ paddingRight: 4 }}>
                    {filesize(torrent.downloaded).human()}
                    {torrent.downloadedSpeed && ` (${filesize(torrent.downloadedSpeed).human()}/sec)`}
                    <DownloadIcon style={{ verticalAlign: 'middle' }} />
                </span>
                <span style={{ paddingRight: 4 }}>
                    {filesize(torrent.uploaded).human()}
                    {torrent.uploadedSpeed && ` (${filesize(torrent.uploadedSpeed).human()}/sec)`}
                    <UploadIcon style={{ verticalAlign: 'middle' }} />
                </span>
                {<span style={{ color: torrent.numPeers ? green[500] : red[700] }}>Pears: {torrent.numPeers}</span>}
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
                    <div>
                        <Typography variant='title' className='expand-header__row'>{title}</Typography>
                        <Typography variant='subheading' className='expand-header__row'>{subheader}</Typography>
                    </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <List className="files-list">
                        {showDetails && torrent.files.map((file, fileIndex) =>
                            <TorrentListItemFile key={fileIndex} {...{torrent, file, fileIndex, onCastFile, onPlayFile}}/>
                        )}
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
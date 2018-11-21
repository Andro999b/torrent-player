import React, { Component } from 'react'

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    ExpansionPanelActions,
    Button,
    List,
    Typography,
    FormControlLabel,
    Checkbox
} from '@material-ui/core'
import {
    ExpandMore as ExpandIcon,
    ArrowDownward as DownloadIcon,
    ArrowUpward as UploadIcon,
    Delete as DeleteIcon
} from '@material-ui/icons'
import { red, green, grey } from '@material-ui/core/colors'

import GroupFiles from './GroupFiles'
import TorrentListItemFile from './TorrentListItemFile'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { inject, observer } from 'mobx-react'

@inject(({
    transitionStore: { playTorrentMedia, openCastTorrentDialog }, 
    libraryStore: { setBackgroudDownload } 
}) => ({
    onPlayFile: playTorrentMedia,
    onCastFile: openCastTorrentDialog,
    onSetBackgroudDownload: setBackgroudDownload
}))
@observer
class TorrentListItem extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            showDetails: false
        }
    }

    handleToggleDetails = () => {
        this.setState(({ showDetails }) => ({ showDetails: !showDetails }))
    }

    renderFiles = (files) => {
        const { torrent, onCastFile, onPlayFile } = this.props 

        return (
            <List style={{width: '100%'}}>
                {files.map((file, fileIndex) =>
                    <TorrentListItemFile key={file.id} {...{torrent, file, fileIndex, onCastFile, onPlayFile}}/>
                )}
            </List>
        )
    }

    render() {
        const { torrent, onDelete, onSetBackgroudDownload } = this.props
        const { showDetails } = this.state

        let downloadSize
        if(torrent.downloaded == torrent.length) {
            downloadSize = filesize(torrent.downloaded).human()
        } else {
            downloadSize = `${filesize(torrent.downloaded).human()} (${filesize(torrent.length).human()})`
        }

        const subtitle = (
            <div style={{ color: grey[600] }}>
                <span style={{ paddingRight: 4 }}>
                    {downloadSize}
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
            <ExpansionPanel expanded={showDetails} onChange={this.handleToggleDetails}>
                <ExpansionPanelSummary expandIcon={<ExpandIcon />} classes={{ content: 'expand-header' }}>
                    <div>
                        <Typography variant="h6" className='expand-header__row'>{title}</Typography>
                        <Typography variant='subtitle1' className='expand-header__row'>{subtitle}</Typography>
                    </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className="files-list">
                    {showDetails && <GroupFiles files={torrent.files} renderFiles={this.renderFiles} />}
                </ExpansionPanelDetails>
                <ExpansionPanelActions>
                    <FormControlLabel
                        control={
                            <Checkbox 
                                onChange={() => onSetBackgroudDownload(torrent)}
                                checked={torrent.downloadInBackground}
                                color="primary"
                            />
                        }
                        label="Download in background"
                    />
                    <Button color="secondary" onClick={() => onDelete(torrent)} variant="contained">
                        <DeleteIcon className="button-icon__left"/>
                        Delete
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
    onCastFile: PropTypes.func,
    onSetBackgroudDownload: PropTypes.func,
}

export default TorrentListItem
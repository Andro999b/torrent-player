import React, { Component } from 'react'

import {
    Button,
    List,
    ListItem,
    ListItemText,
    FormControlLabel,
    Checkbox,
    Paper
} from '@material-ui/core'
import {
    ArrowDownward as DownloadIcon,
    ArrowUpward as UploadIcon,
    Delete as DeleteIcon
} from '@material-ui/icons'
import { red, green, grey } from '@material-ui/core/colors'

import GroupFiles from './GroupFiles'
import SideContent from './SideContent'
import TorrentListItemFile from './TorrentListItemFile'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { inject, observer } from 'mobx-react'
import { creatDirectoryAction } from '../utils/contextSecondaryActions'

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
            open: false
        }
    }

    handleToggleFileList = () => {
        this.setState(({ open }) => ({ open: !open }))
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
        const { torrent, onDelete, onSetBackgroudDownload, onPlayFile, onCastFile } = this.props
        const { open } = this.state

        let downloadSize
        if(torrent.downloaded == torrent.length) {
            downloadSize = filesize(torrent.downloaded).human()
        } else {
            downloadSize = `${filesize(torrent.downloaded).human()} (${filesize(torrent.length).human()})`
        }

        const subtitle = (
            <span style={{ color: grey[600] }}>
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
            </span>
        )

        const title = (
            <span
                style={{ wordBreak: 'break-all' }}>
                {torrent.name}
            </span>
        )

        const directoryActions = [
            { title: 'Cast Group', action: creatDirectoryAction(torrent, onCastFile) },
            { title: 'Play Group', action: creatDirectoryAction(torrent, onPlayFile) }
        ]

        return (
            <Paper square>
                <ListItem button onClick={this.handleToggleFileList}>
                    <ListItemText primary={title} secondary={subtitle}/>
                </ListItem>
                <SideContent open={open} onClose={this.handleToggleFileList} title={torrent.name}>
                    {open && <div className="torrent-item__files-list">
                        <GroupFiles 
                            directoryActions={directoryActions} 
                            files={torrent.files} 
                            renderFiles={this.renderFiles} 
                        />
                    </div>}
                    <div className="torrent-item__actions">
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
                    </div>
                </SideContent>
            </Paper>
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
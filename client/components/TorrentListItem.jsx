import React, { Component, Fragment } from 'react'
import groupBy from 'lodash.groupby'
import memoize from 'memoize-one'

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    ExpansionPanelActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Collapse
} from '@material-ui/core'
import {
    ExpandMore as ExpandIcon,
    ArrowDownward as DownloadIcon,
    ArrowUpward as UploadIcon,
    Delete as DeleteIcon
} from '@material-ui/icons'
import { red, green, grey } from '@material-ui/core/colors'
import TorrentListItemFile from './TorrentListItemFile'
import PropTypes from 'prop-types'
import filesize from 'file-size'
import { inject } from 'mobx-react'

@inject(({ transitionStore: { playMedia, openCastDialog } }) => ({
    onPlayFile: playMedia,
    onCastFile: openCastDialog
}))
class TorrentListItem extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            showDetails: false,
            currentDirectory: null
        }
    }

    getDirectories = memoize(
        (torrent) => groupBy(torrent.files, (file) => file.path)
    )
    
    handleToggleDetails = () => {
        this.setState(({ showDetails }) => ({ showDetails: !showDetails }))
    }

    switchCurrentDirectory(directory) {
        this.setState(({ currentDirectory }) => (
            { currentDirectory: currentDirectory == directory ? null: directory }
        ))
    }

    renderDirectories(directories) {
        const directoriesNames = Object.keys(directories).sort()
        const { currentDirectory } = this.state

        return (
            <List style={{width: '100%'}}>
                {directoriesNames.map((directory) => {
                    const expanded = currentDirectory == directory
                    return (
                        <Fragment key={directory}>
                            <ListItem button
                                onClick={() => this.switchCurrentDirectory(directory)} 
                                key={directory}>
                                <ListItemText primary={directory}/>
                            </ListItem>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                                {expanded && this.renderFiles(directories[directory])}
                            </Collapse>                           
                        </Fragment>
                    )
                })}
            </List>
        )
    } 

    renderFiles(files) {
        const { torrent, onCastFile, onPlayFile } = this.props
        const sortedFiles = files
            .slice() // because of mob x
            .sort((a, b) => a.name.localeCompare(b.name))//sort by name

        return (
            <List style={{width: '100%'}}>
                {sortedFiles.map((file, fileIndex) =>
                    <TorrentListItemFile key={fileIndex} {...{torrent, file, fileIndex, onCastFile, onPlayFile}}/>
                )}
            </List>
        )
    }

    render() {
        const { torrent, onDelete } = this.props
        const { showDetails } = this.state
        const directories = this.getDirectories(torrent)

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

        const content = Object.keys(directories).length > 1 ?
            this.renderDirectories(directories) :
            this.renderFiles(torrent.files)

        return (
            <ExpansionPanel expanded={showDetails} onChange={this.handleToggleDetails}>
                <ExpansionPanelSummary expandIcon={<ExpandIcon />} classes={{ content: 'expand-header' }}>
                    <div>
                        <Typography variant='title' className='expand-header__row'>{title}</Typography>
                        <Typography variant='subheading' className='expand-header__row'>{subheader}</Typography>
                    </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className="files-list">
                    {showDetails && content}
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
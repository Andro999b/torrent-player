import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { creatDirectoryAction } from '../utils/contextSecondaryActions'

import {
    Typography,
    List,
    ListItemText,
    Grid
} from '@material-ui/core'

import { isPlayable } from '../utils'

import GroupFiles from './GroupFiles'
import { inject } from 'mobx-react'
import CastOrPlayListItem from './CastOrPlayListItem'
import { createDownloadSecondaryActions } from '../utils/contextSecondaryActions'

@inject(({ transitionStore: { downloadAndPlay, openCastDialog }, libraryStore: { watchLater }}) => ({
    onPlayFile: downloadAndPlay,
    onCastFile: openCastDialog,
    onWatchLater: watchLater
}))
class SearchResultsItemDetails extends Component {

    renderFiles = (files) => {
        return files.map(this.renderFile)
    }

    renderFile = (file) => {
        const { item: { details } , onPlayFile, onCastFile } = this.props
        const playable = details.type == 'directMedia' || isPlayable(file.name)

        return (
            <CastOrPlayListItem key={file.id} 
                playable={playable} 
                onPlay={() => onPlayFile(details, file)}
                onCast={() => onCastFile(details, file)}
                secondaryActions={createDownloadSecondaryActions(file)} 
            > 
                <ListItemText primary={<span style={{ wordBreak: 'break-all' }}>
                    {file.name}
                </span>}/>
            </CastOrPlayListItem>
        )
    }

    renderTorrent = (torrent, index) => {
        const { onPlayFile, onCastFile } = this.props

        return (
            <CastOrPlayListItem key={index} 
                playable
                onPlay={() => onPlayFile(torrent)}
                onCast={() => onCastFile(torrent)}
            > 
                <ListItemText
                    primary={
                        <span style={{ wordBreak: 'break-all' }}>
                            {torrent.name}
                        </span>
                    } 
                    style={{ paddingLeft: 0 }} 
                />
            </CastOrPlayListItem>
        )
    }

    render() {
        const { item, onPlayFile, onCastFile, onWatchLater } = this.props
        const { details } = item

        if (!details) return null

        const { files, description, torrents } = details
        const posterImage = details.image 
        // setup actions for directory
        const directoryActions = [
            { title: 'Cast Group', action: creatDirectoryAction(details, onCastFile) },
            { title: 'Play Group', action: creatDirectoryAction(details, onPlayFile) }
        ]

        if(!item.isTorrent()) {
            directoryActions.push({ title: 'Watch Later', action: creatDirectoryAction(details, onWatchLater) })
        }

        return (
            <Grid container spacing={3}>
                {posterImage && <Grid item xs={12} md={3}>
                    <img className="poster" src={posterImage} alt='no image' />
                </Grid>}
                <Grid item xs={12} md={posterImage ? 5 : 6}>
                    {description && description.map((item, index) => (
                        <Typography variant="body2" key={index}>
                            {item.name && <b>{item.name}: </b>}
                            <span style={{ wordBreak: 'break-all' }}>{item.value}</span>
                        </Typography>
                    ))}
                </Grid>
                <Grid item xs={12} md={posterImage ? 4 : 6}>
                    <List className="files-list">
                        { files && <GroupFiles files={files} renderFiles={this.renderFiles} directoryActions={directoryActions} /> }
                        { torrents && torrents.map(this.renderTorrent) }
                    </List>
                </Grid>
            </Grid>
        )
    }
}

SearchResultsItemDetails.propTypes = {
    item: PropTypes.object,
    onPlayFile: PropTypes.func,
    onCastFile: PropTypes.func,
    onWatchLater: PropTypes.func
}

export default SearchResultsItemDetails
import React, { Component } from 'react'
import { API_BASE_URL } from '../utils/api'
import PropTypes from 'prop-types'
import urljoin from 'url-join'

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
import watchLater from '../store/watchLater'
import { creatDirectoryAction } from '../utils'

@inject(({ transitionStore }) => ({
    onPlayFile: transitionStore.downloadAndPlay,
    onCastFile: transitionStore.openCastDialog
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
        const { item, onPlayFile, onCastFile } = this.props
        const { details } = item

        if (!details) return null

        const { files, description, torrents } = details
        const posterImage = details.image ? 
            urljoin(API_BASE_URL, `/proxyMedia?url=${encodeURIComponent(details.image)}`)
            : null

        // setup actions for directory
        const directoryActions = [
            { title: 'Cast All', action: creatDirectoryAction(details, onCastFile) },
            { title: 'Play All', action: creatDirectoryAction(details, onPlayFile) }
        ]

        if(!item.isTorrent()) {
            directoryActions.push({ title: 'Watch Later', action: creatDirectoryAction(details, watchLater) })
        }

        return (
            <Grid container spacing={24}>
                {posterImage && <Grid item xs={12} md={3}>
                    <img className="poster" src={posterImage} alt='no image' />
                </Grid>}
                <Grid item xs={12} md={5}>
                    {description && description.map((item, index) => (
                        <Typography variant="body2" key={index}>
                            {item.name && <b>{item.name}: </b>}{item.value}
                        </Typography>
                    ))}
                </Grid>
                <Grid item xs={12} md={4}>
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
    onCastFile: PropTypes.func
}

export default SearchResultsItemDetails
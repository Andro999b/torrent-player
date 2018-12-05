import React, { Component } from 'react'
import PropTypes from 'prop-types'

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

@inject(({ transitionStore }) => ({
    onPlayFile: transitionStore.downloadAndPlay,
    onCastFile: transitionStore.openCastDialog
}))
class SearchResultsItemDetails extends Component {

    renderFiles = (files) => {
        return files.map(this.renderFile)
    }

    renderFile = (file) => {
        const { details, onPlayFile, onCastFile } = this.props
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
        const { details } = this.props
        if (!details) return null

        const { files, description, torrents } = details

        return (
            <Grid container spacing={24}>
                {details.image && <Grid item xs={12} md={3}>
                    <img className="poster" src={`/proxyMedia?url=${encodeURIComponent(details.image)}`} alt='no image' />
                </Grid>}
                <Grid item xs={12} md={5}>
                    {description && description.map((item, index) => (
                        <Typography key={index}>
                            {item.name && <b>{item.name}: </b>}{item.value}
                        </Typography>
                    ))}
                </Grid>
                <Grid item xs={12} md={4}>
                    <List className="files-list">
                        { files && <GroupFiles files={files} renderFiles={this.renderFiles} /> }
                        { torrents && torrents.map(this.renderTorrent) }
                    </List>
                </Grid>
            </Grid>
        )
    }
}

SearchResultsItemDetails.propTypes = {
    details: PropTypes.object,
    onPlayFile: PropTypes.func,
    onCastFile: PropTypes.func
}

export default SearchResultsItemDetails
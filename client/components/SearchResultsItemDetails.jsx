import React, { Component } from 'react'
import PropTypes from 'prop-types'


import {
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    IconButton,
    Grid,
} from '@material-ui/core'

import { isPlayable } from '../utils'

import GroupFiles from './GroupFiles'
import PlayableIcon from '@material-ui/icons/PlayArrow'
import NotPlayableIcon from '@material-ui/icons/InsertDriveFile'
import CastIcon from '@material-ui/icons/Cast'
import { inject } from 'mobx-react'

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
            <ListItem key={file.id} button={playable} onClick={() => onPlayFile(details, file)}>
                <ListItemIcon className="hide-on-mobile">
                    {playable ? <PlayableIcon /> : <NotPlayableIcon />}
                </ListItemIcon>
                <ListItemText primary={<div style={{ wordBreak: 'break-all' }}>{file.name}</div>} style={{ paddingLeft: 0 }} />
                {playable &&
                    <ListItemSecondaryAction>
                        <IconButton onClick={() => onCastFile(details, file)}>
                            <CastIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                }
            </ListItem>
        )
    }

    renderTorrent = (torrent, index) => {
        const { onPlayFile, onCastFile } = this.props

        return (
            <ListItem key={index} button onClick={() => onPlayFile(torrent)}>
                <ListItemIcon className="hide-on-mobile">
                    <PlayableIcon />
                </ListItemIcon>
                <ListItemText primary={<div style={{ wordBreak: 'break-all' }}>{torrent.name}</div>} style={{ paddingLeft: 0 }} />
                <ListItemSecondaryAction>
                    <IconButton onClick={() => onCastFile(torrent)}>
                        <CastIcon />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
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
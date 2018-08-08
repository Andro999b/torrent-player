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
    Grid
} from '@material-ui/core'

import { isPlayable } from '../utils'

import PlayableIcon from '@material-ui/icons/PlayArrow'
import NotPlayableIcon from '@material-ui/icons/InsertDriveFile'
import CastIcon from '@material-ui/icons/Cast'
import { inject } from 'mobx-react'

@inject(({ transitionStore }) => ({
    onPlayFile: transitionStore.downloadAndPlay,
    onCastFile: transitionStore.downloadAndCast
}))
class SearchResultsItemDetails extends Component {

    renderFile = (file, fileIndex) => {
        const { details, onPlayFile, onCastFile } = this.props
        const playable = isPlayable(file.name)

        return (
            <ListItem key={fileIndex} button={playable} onClick={() => onPlayFile(details, fileIndex)}>
                <ListItemIcon className="hide-on-mobile">
                    {playable ? <PlayableIcon /> : <NotPlayableIcon />}
                </ListItemIcon>
                <ListItemText primary={<div style={{ wordBreak: 'break-all' }}>{file.name}</div>} style={{ paddingLeft: 0 }} />
                {playable &&
                    <ListItemSecondaryAction>
                        <IconButton onClick={() => onCastFile(details, fileIndex)}>
                            <CastIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                }
            </ListItem>
        )
    }

    render() {
        const { details } = this.props
        if (!details) return null

        return (
            <div>
                <Grid container spacing={24}>
                    <Grid item xs={12}>
                        <Typography variant='title'>{details.name}</Typography>
                    </Grid>
                    {details.image && <Grid item sm={12} md={3}>
                        <img className="poster" src={`/proxyMedia?url=${encodeURIComponent(details.image)}`} alt='no image' />
                    </Grid>}
                    <Grid item sm={12} md={5}>
                        {details.description.map((item) => (
                            <Typography key={item.name}><b>{item.name}:</b> {item.value}</Typography>
                        ))}
                    </Grid>
                    <Grid item sm={12} md={4}>
                        <List className="files-list">
                            {details.files.map(this.renderFile)}
                        </List>
                    </Grid>
                </Grid>
            </div>
        )
    }
}

SearchResultsItemDetails.propTypes = {
    details: PropTypes.object,
    onPlayFile: PropTypes.func,
    onCastFile: PropTypes.func
}

export default SearchResultsItemDetails
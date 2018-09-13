import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import groupBy from 'lodash.groupby'
import memoize from 'memoize-one'

import {
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    IconButton,
    Grid,
    Collapse
} from '@material-ui/core'

import { isPlayable } from '../utils'

import PlayableIcon from '@material-ui/icons/PlayArrow'
import NotPlayableIcon from '@material-ui/icons/InsertDriveFile'
import CastIcon from '@material-ui/icons/Cast'
import { inject } from 'mobx-react'

@inject(({ transitionStore }) => ({
    onPlayFile: transitionStore.downloadAndPlay,
    onCastFile: transitionStore.openCastDialog
}))
class SearchResultsItemDetails extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            currentDirectory: null
        }
    }

    getDirectories = memoize(
        (files) => groupBy(files, (file) => file.path)
    )

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
        return files.map(this.renderFile)
    }

    renderFile = (file, fileIndex) => {
        const { details, onPlayFile, onCastFile } = this.props
        const playable = isPlayable(file.name)

        return (
            <ListItem key={fileIndex} button={playable} onClick={() => onPlayFile(details, file)}>
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

    render() {
        const { details } = this.props
        if (!details) return null

        const { files } = details
        const directories = this.getDirectories(files)

        const content = Object.keys(directories).length > 1 ?
            this.renderDirectories(directories) :
            this.renderFiles(files)

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
                            {content}
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
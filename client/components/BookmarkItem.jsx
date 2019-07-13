import React, { Component } from 'react'
import PropTypes from 'prop-types'

import CastOrPlayListItem from './CastOrPlayListItem'
import GroupFiles from './GroupFiles'
import FullScreanDialog from './FullScreanDialog'

import {
    ListItemText,
    Paper,
    List
} from '@material-ui/core'

import { 
    creatDirectoryAction, 
    createDownloadSecondaryActions 
} from '../utils'

class SelectFileDialog extends Component {

    renderFiles = (files) => {
        const { item: { playlist }, onCast, onPlay } = this.props

        return (
            <List style={{width: '100%'}}>
                {files.map((file, fileIndex) =>
                    <CastOrPlayListItem key={fileIndex} 
                        playable
                        onPlay={() => onPlay(playlist, file)}
                        onCast={() => onCast(playlist, file)}
                        secondaryActions={createDownloadSecondaryActions(file)} 
                    >
                        <ListItemText primary={file.name} />
                    </CastOrPlayListItem>
                )}
            </List>

        )
    }

    render() {
        const { item: { playlist }, open, onClose, onCast, onPlay } = this.props

        const directoryActions = [
            { title: 'Cast Group', action: creatDirectoryAction(playlist, onCast) },
            { title: 'Play Group', action: creatDirectoryAction(playlist, onPlay) }
        ]

        return (
            <FullScreanDialog open={open} onClose={onClose} title={playlist.name}>
                {open && <GroupFiles 
                    directoryActions={directoryActions} 
                    files={playlist.files} 
                    renderFiles={this.renderFiles} 
                />}
            </FullScreanDialog>
        )
    }
}

SelectFileDialog.propTypes = {
    item: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onPlay: PropTypes.func.isRequired,
    onCast: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

class BookmarkItem extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            showFiles: false
        }
    }

    resumePlaying(playFun) {
        const { 
            item: { 
                playlist, 
                currentFileIndex, 
                currentTime 
            }
        } = this.props
        const { files } = playlist
        const file = files[currentFileIndex]
        
        playFun(playlist, file, currentTime)
    }

    handlePlay = () => this.resumePlaying(this.props.onPlay)
    handleCast = () => this.resumePlaying(this.props.onCast)
    handleRemove = () => this.props.onRemove(this.props.item)
    handleToggleFiles = () => this.setState(({ showFiles }) => ({ showFiles: !showFiles }))
    handleCloseFiles = () => this.setState({ showFiles: false })

    render() {
        const { item: { playlist, currentFileIndex }} = this.props
        const { showFiles } = this.state
        const { name, files } = playlist
        const fileName = files[currentFileIndex].name

        return (
            <Paper square>
                <CastOrPlayListItem playable onPlay={this.handlePlay} onCast={this.handleCast} secondaryActions={[
                    { title: 'Clean', action: this.handleRemove },
                    { title: 'Show File', action: this.handleToggleFiles }
                ]}>
                    <ListItemText primary={name} secondary={
                        <span style={{ wordBreak: 'break-all' }}>
                            {fileName}
                        </span>
                    }/>
                </CastOrPlayListItem>
                <SelectFileDialog open={showFiles} onClose={this.handleCloseFiles} {...this.props}/>
            </Paper>
        )
    }
}

BookmarkItem.propTypes = {
    item: PropTypes.object.isRequired,
    onPlay: PropTypes.func.isRequired,
    onCast: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
}

export default BookmarkItem
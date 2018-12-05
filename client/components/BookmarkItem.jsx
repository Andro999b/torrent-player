import React, { Component } from 'react'
import PropTypes from 'prop-types'
import CastOrPlayListItem from './CastOrPlayListItem'

import {
    ListItemText,
    Paper
} from '@material-ui/core'

class BookmarkItem extends Component {
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

    render() {
        const { item: { playlist, currentFileIndex }} = this.props
        const { name, files } = playlist
        const fileName = files[currentFileIndex].name

        return (
            <Paper square>
                <CastOrPlayListItem playable onPlay={this.handlePlay} onCast={this.handleCast} secondaryActions={[
                    { title: 'Clean', action: this.handleRemove }
                ]}>
                    <ListItemText primary={name} secondary={
                        <span style={{ wordBreak: 'break-all' }}>
                            {fileName}
                        </span>
                    }/>
                </CastOrPlayListItem>
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
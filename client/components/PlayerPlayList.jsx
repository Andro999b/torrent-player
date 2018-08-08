import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
    List,
    ListItem,
    ListItemText,
    Paper,
    Slide
} from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import { observer } from 'mobx-react'

@observer
class PlayerPlayList extends Component {
    render() {
        const { device: { playlist, currentFileIndex }, open, onFileSelected } = this.props
        const { files } = playlist

        return (
            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Paper elevation={12} square className="player__file-list">
                    <List>
                        {files.map((file, fileIndex) => {
                            const style = currentFileIndex === fileIndex ? { background: grey[600] } : {}

                            return (
                                <ListItem button key={fileIndex} style={style} onClick={() => onFileSelected(fileIndex)}>
                                    <ListItemText primary={file.name} />
                                </ListItem>
                            )
                        })}
                    </List>
                </Paper>
            </Slide>
        )
    }
}

PlayerPlayList.propTypes = {
    device: PropTypes.object.isRequired,
    open: PropTypes.bool,
    onFileSelected: PropTypes.func.isRequired
}

export default PlayerPlayList
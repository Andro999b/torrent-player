import React, { Component } from 'react'
import PropTypes from 'prop-types'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Paper from 'material-ui/Paper'
import Slide from 'material-ui/transitions/Slide'

import PlayingIcon from 'material-ui-icons/PlayArrow'
import { observer } from 'mobx-react'

@observer
class PlayerFilesList extends Component {
    render() {
        const { lastPosition, open, onFileSelected } = this.props
        const { files, currentIndex } = lastPosition

        return (
            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Paper elevation={12} square className="player__file-list">
                    <List>
                        {files.map((file, fileIndex) =>
                            <ListItem
                                button
                                key={fileIndex}
                                onClick={() => onFileSelected(fileIndex)}
                            >
                                {
                                    currentIndex == fileIndex &&
                                    <ListItemIcon>
                                        <PlayingIcon />
                                    </ListItemIcon>
                                }
                                <ListItemText primary={file.name} />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            </Slide>
        )
    }
}

PlayerFilesList.propTypes = {
    lastPosition: PropTypes.object.isRequired,
    open: PropTypes.bool,
    onFileSelected: PropTypes.func.isRequired
}

export default PlayerFilesList
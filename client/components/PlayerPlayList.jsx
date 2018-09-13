import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import {
    List,
    ListItem,
    ListItemText,
    Paper,
    Slide,
    Menu,
    MenuItem
} from '@material-ui/core'
import groupBy from 'lodash.groupby'
import { grey } from '@material-ui/core/colors'
import ExpandMore from '@material-ui/icons/ExpandMore'
import { observer } from 'mobx-react'
import memoize from 'memoize-one'

@observer
class PlayerPlayList extends Component {    

    constructor(props, context) {
        super(props, context)
        
        this.state = {
            selectedGroup: null,
            anchorEl: null,
        }
    }

    handleOpenGroupsMenu = (event) => {
        this.setState({ anchorEl: event.currentTarget })
    };

    handleCloseGroupsMenu = () => {
        this.setState({ anchorEl: null })
    };
    
    handleSelectGroup = (selectedGroup) => {
        this.setState({ selectedGroup, anchorEl: null })
    }

    getGroups = memoize(
        (files) => groupBy(files, (file) => file.path)
    )

    render() {
        const { selectedGroup, anchorEl } = this.state
        const { device: { playlist, currentFileIndex }, open, onFileSelected } = this.props
        const { files } = playlist

        const groups = this.getGroups(files)
        const currentGroup = selectedGroup || files[currentFileIndex].path
        const groupFiles = Object.keys(groups).length > 1 ? groups[currentGroup] : files
        const sortedFiles = groupFiles
            .slice() // becuase of mobx
            .sort((a, b) => a.name.localeCompare(b.name))

        return (
            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Paper elevation={12} square className="player__file-list">
                    {Object.keys(groups).length > 1 && <Fragment>
                        <List>
                            <ListItem button style={{ background: grey[600] }} onClick={this.handleOpenGroupsMenu}>
                                <ListItemText primary={currentGroup} />
                                <ExpandMore nativeColor="white" />
                            </ListItem>
                        </List>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={this.handleCloseGroupsMenu}>
                            {Object.keys(groups).sort().map((groupName) => (
                                <MenuItem 
                                    key={groupName} 
                                    selected={groupName == selectedGroup}
                                    onClick={() => this.handleSelectGroup(groupName)}>
                                    {groupName}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Fragment>}
                    <List>
                        {sortedFiles.map((file) => {
                            const style = currentFileIndex === file.index ? { background: grey[600] } : {}
                            return (
                                <ListItem button key={file.id} style={style} onClick={() => onFileSelected(file.index)}>
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
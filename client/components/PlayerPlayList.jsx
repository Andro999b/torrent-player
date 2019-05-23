import React, { Component } from 'react'
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
import { grey } from '@material-ui/core/colors'
import ExpandMore from '@material-ui/icons/ExpandMore'
import { observer } from 'mobx-react'
import memoize from 'memoize-one'
import { fileGroupingFun } from './GroupFiles'
import ShowIf from './ShowIf'

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

    getGroups = memoize(fileGroupingFun)
    getFileGroup = memoize((fileIndex, groups) =>
        groups.find((g) =>
            g.files.find((f) => f.index == fileIndex) != null
        )
    )   

    render() {
        let { selectedGroup, anchorEl } = this.state
        const { device: { playlist, currentFileIndex }, open, onFileSelected } = this.props
        const { files } = playlist

        const groups = this.getGroups(files)

        const currentGroup = this.getFileGroup(currentFileIndex, groups)
        selectedGroup = selectedGroup || currentGroup

        const groupFiles = groups.length > 1 ? selectedGroup.files : files
        const sortedFiles = groupFiles

        return (
            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Paper elevation={12} square className="player__file-list">
                    <ShowIf must={[groups.length > 1]}>
                        <List>
                            <ListItem  button style={{ background: grey[600] }} onClick={this.handleOpenGroupsMenu}>
                                <ListItemText primary={selectedGroup.name} />
                                <ExpandMore nativeColor="white" />
                            </ListItem>
                        </List>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={this.handleCloseGroupsMenu}>
                            {groups.map((group) => (
                                <MenuItem 
                                    key={group.name} 
                                    style={group.name == selectedGroup.name ? { background: grey[600] } : {}}
                                    onClick={() => this.handleSelectGroup(group)}>
                                    <span style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                        {group.name}
                                    </span>
                                </MenuItem>
                            ))}
                        </Menu>
                    </ShowIf>
                    <List>
                        {sortedFiles.map((file) => {
                            const style = currentFileIndex === file.index ? { background: grey[600] } : {}
                            return (
                                <ListItem 
                                    button 
                                    key={file.id} 
                                    style={style} 
                                    onClick={() => onFileSelected(file.index)}>
                                    <ListItemText primary={
                                        <span style={{ wordBreak: 'break-all' }}>
                                            {file.name}
                                        </span>
                                    } />
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
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import {
    List,
    ListItem,
    ListItemText,
    Paper,
    Slide
} from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import { NavigateBeforeRounded as BackIcon } from '@material-ui/icons'
import { observer } from 'mobx-react'
import memoize from 'memoize-one'
import { fileGroupingFun } from './GroupFiles'

@observer
class PlayerPlayList extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            selectedGroup: null,
            selectGroup: false,
        }
    }

    handleOpenGroupsMenu = () => {
        this.setState({ selectGroup: true })
    };

    handleCloseGroupsMenu = () => {
        this.setState({ selectGroup: false })
    };

    handleSelectGroup = (selectedGroup) => {
        this.setState({ selectedGroup, selectGroup: false })
    }

    getGroups = memoize(fileGroupingFun)
    getFileGroup = memoize((fileId, groups) =>
        groups.find((g) =>
            g.files.find((f) => f.id == fileId) != null
        )
    )

    render() {
        let { selectedGroup, selectGroup } = this.state
        const { device: { playlist, currentFileIndex }, open, onFileSelected } = this.props
        const { files } = playlist

        const groups = this.getGroups(files)

        const currentFileId = files[currentFileIndex].id
        const currentGroup = this.getFileGroup(currentFileId, groups)
        selectedGroup = selectedGroup || currentGroup

        const groupFiles = groups.length > 1 ? selectedGroup.files : files
        const sortedFiles = groupFiles

        return (
            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Paper elevation={12} square className="player__file-list">
                    <List>
                        {!selectGroup && <Fragment>
                            {groups.length > 1 &&
                                <ListItem button onClick={this.handleOpenGroupsMenu}>
                                    <BackIcon nativeColor="white" />
                                    <ListItemText primary={selectedGroup.name} />
                                </ListItem>
                            }
                            {sortedFiles.map((file) => {
                                const style = currentFileId == file.id ? { background: grey[600] } : {}
                                return (
                                    <ListItem
                                        button
                                        key={file.id}
                                        style={style}
                                        onClick={() => onFileSelected(files.findIndex((i) => i.id == file.id))}>
                                        <ListItemText primary={
                                            <span style={{ wordBreak: 'break-all' }}>
                                                {file.name}
                                            </span>
                                        } />
                                    </ListItem>
                                )
                            })}
                        </Fragment>}
                        {selectGroup && groups.map((group) => (
                            <ListItem
                                button
                                key={group.name}
                                style={group.name == selectedGroup.name ? { background: grey[600] } : {}}
                                onClick={() => this.handleSelectGroup(group)}>
                                <ListItemText primary={
                                    <span style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                        {group.name}
                                    </span>
                                } />
                            </ListItem>
                        ))}
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
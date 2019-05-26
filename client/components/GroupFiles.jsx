import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import groupBy from 'lodash.groupby'
import memoize from 'memoize-one'

import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Collapse,
    Menu,
    MenuItem
} from '@material-ui/core'

import { MoreVert as MoreIcon} from '@material-ui/icons'

export function fileGroupingFun(files) {
    const maxfiles = GroupFiles.MAX_FILES
    const groupedByPath = groupBy(files, (file) => file.path)
    if(Object.keys(groupedByPath).length == 1 && files.length > maxfiles) { //split by hundreds
        return files
            .reduce((acc, item, i) => {
                const groupIndex = Math.floor(i / maxfiles) 

                if(acc[groupIndex]) {
                    acc[groupIndex].files.push(item)
                } else {
                    acc[groupIndex] = {
                        name: `${groupIndex * maxfiles} - ${(groupIndex+1) * maxfiles - 1}`,
                        files: [item]
                    }
                }

                return acc
            }, [])
    }
    return Object.keys(groupedByPath)
        .map((key) => ({
            name: key,
            files: groupedByPath[key]
        }))
}

class GroupFilesHeader extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = { anchorEl: null }
    }

    handleOpenMenu = (event) => this.setState({ anchorEl: event.currentTarget })
    handleCloseMenu = () => this.setState({ anchorEl: null })

    render() {
        const { onSelect, directory, directoryActions } = this.props
        const { anchorEl } = this.state

        return (
            <ListItem
                button
                onClick={() => onSelect(directory)}>
                <ListItemText primary={directory.name}/>
                {directoryActions && 
                    <ListItemSecondaryAction>
                        <IconButton onClick={this.handleOpenMenu}>
                            <MoreIcon/>
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={anchorEl != null} onClose={this.handleCloseMenu}>
                            {directoryActions.map(({title, action}) => 
                                <MenuItem key={title} onClick={() => {
                                    action(directory)
                                    this.handleCloseMenu()
                                }}>
                                    {title}
                                </MenuItem>
                            )}
                        </Menu>
                    </ListItemSecondaryAction>
                }
            </ListItem>
        )
    }
}

GroupFilesHeader.propTypes = {
    onSelect: PropTypes.func.isRequired,
    directory: PropTypes.object,
    directoryActions: PropTypes.array
}

class GroupFiles extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            currentDirectory: null
        }
    }

    getDirectories = memoize(fileGroupingFun)

    switchCurrentDirectory(directory) {
        this.setState(({ currentDirectory }) => (
            { currentDirectory: currentDirectory == directory ? null: directory }
        ))
    }

    renderDirectories(directories) {
        const { currentDirectory } = this.state
        const { renderFiles, directoryActions } = this.props

        return (
            <List style={{width: '100%'}}>
                {directories.map((directory) => {
                    const expanded = currentDirectory == directory.name
                    return (
                        <Fragment key={directory.name}>
                            <GroupFilesHeader 
                                directory={directory}
                                directoryActions={directoryActions}
                                onSelect={(d) => this.switchCurrentDirectory(d.name)}
                            />
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                                {expanded && renderFiles(directory.files)}
                            </Collapse>                           
                        </Fragment>
                    )
                })}
            </List>
        )
    }

    render() {
        const { files, renderFiles } = this.props
        const directories = this.getDirectories(files)

        return directories.length > 1 ?
            this.renderDirectories(directories) :
            renderFiles(files)
    }
}
GroupFiles.MAX_FILES = 50

GroupFiles.propTypes = {
    files: PropTypes.array.isRequired,
    renderFiles: PropTypes.func.isRequired,
    directoryActions: PropTypes.array
}

export default GroupFiles
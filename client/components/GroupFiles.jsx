import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import groupBy from 'lodash.groupby'
import memoize from 'memoize-one'

import {
    List,
    ListItem,
    ListItemText,
    Collapse
} from '@material-ui/core'

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
        const { renderFiles } = this.props

        return (
            <List style={{width: '100%'}}>
                {directories.map((directory) => {
                    const expanded = currentDirectory == directory.name
                    return (
                        <Fragment key={directory.name}>
                            <ListItem button
                                onClick={() => this.switchCurrentDirectory(directory.name)}>
                                <ListItemText primary={directory.name}/>
                            </ListItem>
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
    renderFiles: PropTypes.func.isRequired
}

export default GroupFiles
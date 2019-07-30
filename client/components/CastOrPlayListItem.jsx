import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import {
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    Menu,
    MenuItem
} from '@material-ui/core'
import {
    PlayArrow as PlayableIcon,
    MoreVert as MoreIcon,
    Cast as CastIcon,
    InsertDriveFile as NotPlayableIcon
} from '@material-ui/icons'

import { isMobileApp } from '../utils'

class CastOrPlayListItem extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = { anchorEl: null }
    }

    handleOpenMenu = (event) => this.setState({ anchorEl: event.currentTarget })
    handleCloseMenu = () => this.setState({ anchorEl: null })

    render() {
        const { playable, onPlay, onCast, secondaryActions } = this.props
        const { anchorEl } = this.state
        const mobileApp = isMobileApp()

        const primartyIcon = playable ? (mobileApp ? <CastIcon/> : <PlayableIcon />) : <NotPlayableIcon/>
        const primaryAction = mobileApp ? onCast : onPlay
        const secondaryAction = mobileApp ? onPlay : onCast
        const secondaryTitle = mobileApp ? 'Play' : 'Cast'
        const secondaryIcon = mobileApp ? <PlayableIcon/> : <CastIcon/>

        return (
            <ListItem button={playable} onClick={primaryAction} ContainerComponent="div">
                <ListItemIcon className="hide-on-mobile">
                    {primartyIcon}
                </ListItemIcon>
                {this.props.children}
                <ListItemSecondaryAction>
                    {(!secondaryActions && playable) && 
                        <IconButton onClick={secondaryAction}>
                            {secondaryIcon}
                        </IconButton>
                    }
                    {secondaryActions && <Fragment>
                        <IconButton onClick={this.handleOpenMenu}>
                            <MoreIcon/>
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={anchorEl != null} onClose={this.handleCloseMenu}>
                            {playable &&
                                <MenuItem onClick={secondaryAction}>
                                    {secondaryTitle}
                                </MenuItem>
                            }
                            {secondaryActions.map(({title, action}, index) => 
                                <MenuItem key={index} onClick={() => {
                                    action && action()
                                    this.handleCloseMenu()
                                }}>
                                    {title}
                                </MenuItem>
                            )}
                        </Menu>
                    </Fragment>}
                </ListItemSecondaryAction>
            </ListItem>
        )
    }
}

CastOrPlayListItem.propTypes = {
    onPlay: PropTypes.func,
    onCast: PropTypes.func,
    playable: PropTypes.bool,
    secondaryActions: PropTypes.array,
    children: PropTypes.element.isRequired
}

export default CastOrPlayListItem
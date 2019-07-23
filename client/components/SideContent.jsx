import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    Typography,
    IconButton,
    Toolbar,
    SwipeableDrawer,
    Paper
} from '@material-ui/core'
import {
    Close as CloseIcon
} from '@material-ui/icons'


class SideContent extends Component {
    render() {
        const { title, open, onClose, children } = this.props

        return (
            <SwipeableDrawer 
                open={open} 
                onClose={onClose}
                onOpen={() => null}
                anchor="right" 
            >
                <Paper square>
                    <Toolbar className="full-screan-dialog__toolbar">
                        <Typography variant="h6"  className="full-screan-dialog__title">
                            {title}
                        </Typography>
                        <IconButton edge="end" color="inherit" onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </Paper>
                <div className="full-screan-dialog__content">
                    {children}
                </div>
            </SwipeableDrawer>
        )
    }
}

SideContent.propTypes = {
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    open: PropTypes.bool,
    children: PropTypes.node.isRequired,
}

export default SideContent
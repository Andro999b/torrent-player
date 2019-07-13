import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    Dialog,
    Typography,
    IconButton,
    Toolbar,
    AppBar,
    Slide
} from '@material-ui/core'
import {
    Close as CloseIcon
} from '@material-ui/icons'

// eslint-disable-next-line react/display-name
const Transition = React.forwardRef((props, ref) => 
    <Slide direction="right" ref={ref} {...props} />
)

class FullScreanDialog extends Component {
    render() {
        const { title, open, onClose, children } = this.props

        return (
            <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
                <AppBar>
                    <Toolbar className="full-screan-dialog__toolbar">
                        <Typography variant="h6"  className="full-screan-dialog__title">
                            {title}
                        </Typography>
                        <IconButton edge="end" color="inherit" onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <div className="full-screan-dialog__content">
                    {children}
                </div>
            </Dialog>
        )
    }
}

FullScreanDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    open: PropTypes.bool,
    children: PropTypes.node.isRequired,
}

export default FullScreanDialog
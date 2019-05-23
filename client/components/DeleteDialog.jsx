import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@material-ui/core'

class DeleteDialog extends Component {
    render() {
        const { 
            item, 
            onAccept, 
            onReject, 
            renderText, 
            renderTitle 
        } = this.props

        if(item != null) {
            this.renderedContent = 
                <Fragment>
                    <DialogTitle>{renderTitle(item)}</DialogTitle>
                    <DialogContent>
                        {item && <DialogContentText>{renderText(item)}</DialogContentText>}
                    </DialogContent>
                </Fragment>
        }

        return (
            <Dialog open={item != null} onClose={onReject}>
                {this.renderedContent}
                <DialogActions>
                    <Button onClick={onReject} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => onAccept(item)} color="secondary" variant="contained" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

DeleteDialog.propTypes = {
    renderTitle: PropTypes.func.isRequired,
    renderText: PropTypes.func.isRequired,
    item: PropTypes.object,
    onAccept: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
}

export default DeleteDialog
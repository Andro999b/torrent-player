import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Snackbar } from '@material-ui/core'

import { observer, inject } from 'mobx-react'

@inject('notificationStore') @observer
class Notification extends Component {

    handleClose = () => {
        this.props.notificationStore.hideMessage()
    };

    render() {
        const { notificationStore } = this.props
        const { message, open } = notificationStore

        return (
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                autoHideDuration={2000}
                open={open}
                onClose={this.handleClose}
                onClick={this.handleClose}
                message={message}
            />
        )
    }
}

Notification.propTypes = {
    notificationStore: PropTypes.object
}

export default Notification
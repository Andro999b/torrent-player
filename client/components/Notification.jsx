import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Snackbar, Slide } from '@material-ui/core'

import { observer, inject } from 'mobx-react'

@inject('notificationStore') @observer
class Notification extends Component {
    constructor(props, context) {
        super(props, context)
    }

    handleClose = () => {
        this.props.notificationStore.hideMessage()
    };

    render() {
        const { notificationStore } = this.props
        const { message, open } = notificationStore

        return (
            <Snackbar
                autoHideDuration={2000}
                open={open}
                onClose={this.handleClose}
                message={message}
            />
        )
    }
}

Notification.propTypes = {
    notificationStore: PropTypes.object
}

export default Notification
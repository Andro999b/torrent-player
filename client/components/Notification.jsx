import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Snackbar from 'material-ui/Snackbar'
import Slide from 'material-ui/transitions/Slide'

import { observer, inject } from 'mobx-react'

function TransitionUp(props) {
    return <Slide direction="up" {...props} />
}

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
                autoHideDuration={5000}
                open={open}
                onClose={this.handleClose}
                onRequestClose={this.handleClose}
                transition={TransitionUp}
                message={message}
            />
        )
    }
}

Notification.propTypes = {
    notificationStore: PropTypes.object
}

export default Notification
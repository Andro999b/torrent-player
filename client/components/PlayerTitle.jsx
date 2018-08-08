import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { IconButton, Typography } from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'

class PlayerTitle extends Component {
    render() {
        const { title, onClose} = this.props

        return (
            <div className="player__title">
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
                <Typography variant="title">{title}</Typography>
            </div>
        )
    }
}

PlayerTitle.propTypes = {
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
}

export default PlayerTitle
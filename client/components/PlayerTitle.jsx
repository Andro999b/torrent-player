import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Typography, Fab } from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'

class PlayerTitle extends Component {
    render() {
        const { title, onClose} = this.props

        return (
            <div className="player__title">
                <Fab onClick={onClose} style={{height: 46, minWidth: 46, width: 46}}>
                    <CloseIcon />
                </Fab>
                <Typography variant="h6" style={{ wordBreak: 'break-all', marginLeft: '10px' }}>
                    {title}
                </Typography>
            </div>
        )
    }
}

PlayerTitle.propTypes = {
    title: PropTypes.string,
    onClose: PropTypes.func.isRequired
}

export default PlayerTitle
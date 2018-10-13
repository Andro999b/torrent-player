import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@material-ui/core'
import { inject } from 'mobx-react'
import { toJS } from 'mobx'

@inject('remoteControl')
class CastAwaitView extends Component {
    componentDidMount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(true)
    }

    componentWillUnmount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(false)
    }

    render() {
        const { remoteControl: { deviceName } } = this.props

        return (
            <Typography className="center" align="center" variant="display1">
                Awaiting connection<br/>
                Device name: { toJS(deviceName) }
            </Typography>
        )
    }
}

CastAwaitView.propTypes = {
    remoteControl: PropTypes.object
}

export default CastAwaitView
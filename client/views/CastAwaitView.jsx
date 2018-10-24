import React, { Component } from 'react'
import PropTypes from 'prop-types'
import fscreen from 'fscreen'

import { Typography } from '@material-ui/core'
import { inject, observer } from 'mobx-react'
import { toJS } from 'mobx'

@inject('remoteControl')
@observer
class CastAwaitView extends Component {
    componentDidMount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(true)

        if(fscreen.fullscreenEnabled) {
            fscreen.requestFullscreen(this.node)
        }
    }

    componentWillUnmount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(false)
    }

    render() {
        const { remoteControl: { deviceName } } = this.props

        return (
            <div  className="screan-view" ref={(node) => (this.node = node)}>
                <Typography className="center" align="center" variant="h4">
                    Awaiting connection<br/>
                    { toJS(deviceName) }
                </Typography>
            </div>
        )
    }
}

CastAwaitView.propTypes = {
    remoteControl: PropTypes.object
}

export default CastAwaitView
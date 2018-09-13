import React, { Component, Fragment } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

import { Typography } from '@material-ui/core'
import LocalPlayer from '../components/LocalPlayer'
import RemotePlayer from '../components/RemotePlayer'

const playerTheme = (mainTheme) => createMuiTheme({
    palette: {
        primary: mainTheme.palette.primary,
        secondary: mainTheme.palette.secondary,
        type: 'dark',
    },
    overrides: {
        MuiIconButton: {
            root: {
                width: 32,
                height: 32
            }
        }
    }
})

@inject('playerStore', 'remoteControl')
@observer
class PlayerView extends Component {
    componentDidMount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(true)
    }

    componentWillUnmount() {
        const { remoteControl: { setAvailability } } = this.props
        setAvailability(false)
    }

    render() {
        const { playerStore } = this.props

        if (!playerStore) return null

        const { device } = playerStore

        return (
            <MuiThemeProvider theme={playerTheme}>
                <div className="player__screen">
                    {!device && <Typography align="center" variant="display1">
                        Waiting for video to be ready
                    </Typography>}
                    {device &&
                        <Fragment>
                            {device.isLocal() && <LocalPlayer />}
                            {!device.isLocal() && <RemotePlayer />}
                        </Fragment>
                    }
                </div>
            </MuiThemeProvider>
        )
    }
}

PlayerView.propTypes = {
    playerStore: PropTypes.object,
    remoteControl: PropTypes.object
}

export default PlayerView
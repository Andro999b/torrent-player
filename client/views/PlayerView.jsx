import React, { Component, Fragment } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

import { Typography } from '@material-ui/core'
import LocalPlayer from '../components/LocalPlayer'
import { getCurrentDeviceId } from '../store/remote-control'

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

@inject('playerStore') @observer
class PlayerView extends Component {

    render() {
        const { playerStore } = this.props

        if (!playerStore) return null

        const { device } = playerStore

        return (
            <MuiThemeProvider theme={playerTheme}>
                <div className="player__screen">
                    {!device && <Typography align="center" variant="display1">
                        Please select file to play
                    </Typography>}
                    {device &&
                        <Fragment>
                            {device.isLocal() && <LocalPlayer {...{ playerStore }} />}
                        </Fragment>
                    }
                </div>
            </MuiThemeProvider>
        )
    }
}

PlayerView.propTypes = {
    playerStore: PropTypes.object
}

export default PlayerView
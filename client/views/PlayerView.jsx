import React, { Component, Fragment } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

import { CircularProgress } from '@material-ui/core'
import LocalPlayer from '../components/LocalPlayer'
import RemotePlayer from '../components/RemotePlayer'

const playerTheme = (mainTheme) => createMuiTheme({
    palette: {
        primary: mainTheme.palette.primary,
        secondary: mainTheme.palette.secondary,
        type: 'dark',
    },
    overrides: {
        MuiLinearProgress: {
            colorSecondary: {
                backgroundColor: 'transparent'
            }
        },
        MuiMenuItem: {
            root: {
                height: 'initial'
            }
        }
    },
    typography: {
        useNextVariants: true
    },
})



@inject('playerStore')
@observer
class PlayerView extends Component {
    render() {
        const { playerStore: { device } } = this.props

        return (
            <MuiThemeProvider theme={playerTheme}>
                <div className="player__screen">
                    {!device && <CircularProgress  color="secondary" className="center"/>}
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
    playerStore: PropTypes.object
}

export default PlayerView
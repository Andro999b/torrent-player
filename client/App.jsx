import './styles.scss'
import { hot } from 'react-hot-loader'
import React, { Component } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'
import { Provider } from 'mobx-react'

import './store/remote-control'
import { hasArgv } from './utils'
// import DevTools from 'mobx-react-devtools'
import Root from './Root'
import CastScreanRoot from './CastScreanRoot'
import stores from './store'

import JssProvider from 'react-jss/lib/JssProvider'
import { create } from 'jss'
import { createGenerateClassName, jssPreset } from '@material-ui/core/styles'

const generateClassName = createGenerateClassName();
const jss = create({
    ...jssPreset(),
    // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
    insertionPoint: 'jss-insertion-point',
})

const theme = createMuiTheme({
    palette: {
        secondary: {
            light: red.A200,
            main: red[500],
            dark: red[900],
            contrastText: '#fff'
        }
    },
    typography: {
        useNextVariants: true
    },
    overrides: {
        MuiListItemIcon: {
            root: {
                marginRight: 0
            }
        },
        MuiListItemText: {
            root: {
                padding: '0 5px 0 16px'
            }
        },
        MuiExpansionPanelActions: {
            root: {
                padding: '16px'
            }
        }
    }
})

class App extends Component {
    render() {
        const root = hasArgv('cast-screen') ?
            <CastScreanRoot /> :
            <Root />

        return (
            <JssProvider jss={jss} generateClassName={generateClassName}>
                <MuiThemeProvider theme={theme}>
                    <Provider {...stores}>
                        {root}
                    </Provider>
                </MuiThemeProvider>
            </JssProvider>
        )
    }
}

export default hot(module)(App)
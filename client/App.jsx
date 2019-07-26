import './styles.scss'
import React, { Component } from 'react'
import { createMuiTheme } from '@material-ui/core/styles'
import { blue, red } from '@material-ui/core/colors'
import { Provider } from 'mobx-react'

import './store/remote-control'
import { hasArgv } from './utils'
// import DevTools from 'mobx-react-devtools'
import Root from './Root'
import CastScreanRoot from './CastScreanRoot'
import stores from './store'

import JssProvider from 'react-jss/lib/JssProvider'
import { create } from 'jss'
import { createGenerateClassName, jssPreset, ThemeProvider } from '@material-ui/styles'

const generateClassName = createGenerateClassName()
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
        },
        primary: {
            light: blue.A200,
            main: blue[500],
            dark: blue[500],
            contrastText: '#fff'
        }
    },
    typography: {
        useNextVariants: true
    },
    overrides: {
        MuiListItemIcon: {
            root: {
                marginRight: 0,
                minWidth: '30px'
            }
        },
        MuiExpansionPanelActions: {
            root: {
                padding: '16px'
            }
        },
        MuiList: {
            padding: {
                paddingTop: 0,
                paddingBottom: 0
            }
        },
        MuiListSubheader: {
            gutters: {
                paddingLeft: 16,
                paddingRight: 16,
                '@media (min-width:600px)': {
                    paddingLeft: 16,
                    paddingRight: 16
                }
            }
        },
        MuiDrawer: {
            paper: {
                minWidth: '100%',
                '@media (min-width:600px)': {
                    minWidth: '40%',
                }
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
                <ThemeProvider theme={theme}>
                    <Provider {...stores}>
                        {root}
                    </Provider>
                </ThemeProvider>
            </JssProvider>
        )
    }
}

export default App
import React, { Component } from 'react'
import Root from './Root'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'
import DevTools from 'mobx-react-devtools'

import navigationStore from './store/navigation-store'

const theme = createMuiTheme({
    palette: {

    }
})

class App extends Component {
    render() {
        return (
            <div>
                <MuiThemeProvider theme={theme}>
                    <Root navigationStore={navigationStore}/>
                </MuiThemeProvider>
                <DevTools />
            </div>
        )
    }
}

export default App
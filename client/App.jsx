import React, { Component } from 'react'
import Root from './Root'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'
// import DevTools from 'mobx-react-devtools'

import stores from './store'
import { Provider } from 'mobx-react'

const theme = createMuiTheme({
    palette: {

    }
})

class App extends Component {
    render() {
        return (
            <div>
                <MuiThemeProvider theme={theme}>
                    <Provider {...stores}>
                        <Root />
                    </Provider>
                </MuiThemeProvider>
                {/* <DevTools /> */}
            </div>
        )
    }
}

export default App
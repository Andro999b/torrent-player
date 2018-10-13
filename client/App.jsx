import './styles.scss'
import { hot } from 'react-hot-loader'
import React, { Component } from 'react'
import Root from './Root'
import JssProvider from 'react-jss/lib/JssProvider'
import { create } from 'jss'
import { 
    MuiThemeProvider, 
    createMuiTheme,
    createGenerateClassName, 
    jssPreset 
} from '@material-ui/core/styles'
import './store/remote-control'
// import DevTools from 'mobx-react-devtools'

import stores from './store'
import { Provider } from 'mobx-react'

const generateClassName = createGenerateClassName()
const jss = create(jssPreset())
// We define a custom insertion point that JSS will look for injecting the styles in the DOM.
jss.options.insertionPoint = 'jss-insertion-point'

const theme = createMuiTheme({
    palette: {
        //TODO: customuize colors?
    }
})

class App extends Component {
    render() {
        return (
            <div>
                <JssProvider jss={jss} generateClassName={generateClassName}>
                    <MuiThemeProvider theme={theme}>
                        <Provider {...stores}>
                            <Root />
                        </Provider>
                    </MuiThemeProvider>
                </JssProvider>
                {/* <DevTools /> */}
            </div>
        )
    }
}

export default hot(module)(App)
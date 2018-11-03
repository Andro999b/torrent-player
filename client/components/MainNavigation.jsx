import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { 
    Search as SearchIcon,
    ListRounded as LibraryIcon,
    Airplay as CastScreanIcon,
    Input as ConnectIcon
} from '@material-ui/icons'
import { isMobile } from '../utils'

class MainNavigation extends Component {

    handleChange = (_, value) => {
        const { goToScreen } = this.props
        if (typeof value == 'function')
            value()
        else
            goToScreen(value)
    }

    handleConnect = () => this.props.onConnect()

    render() {
        const { screen, isCastAvaliable } = this.props
        const mobile = isMobile()

        return (
            <BottomNavigation
                showLabels={!mobile} className="main-navigation"
                value={screen}
                onChange={this.handleChange}
            >
                <BottomNavigationAction value="search" label="Search" icon={<SearchIcon />} />
                <BottomNavigationAction value="library" label="Library" icon={<LibraryIcon />} />
                { isCastAvaliable && <BottomNavigationAction value="cast-screan" label="Cast Screan" icon={<CastScreanIcon />} /> }
                <BottomNavigationAction value={this.handleConnect} label="Connect" icon={<ConnectIcon />} />
            </BottomNavigation>
        )
    }
}

MainNavigation.propTypes = {
    screen: PropTypes.string.isRequired,
    isCastAvaliable: PropTypes.bool,
    onConnect: PropTypes.func.isRequired,
    goToScreen: PropTypes.func.isRequired
}

export default MainNavigation
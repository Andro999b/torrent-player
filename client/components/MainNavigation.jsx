import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { 
    Search as SearchIcon,
    List as TorrentsIcon,
    DesktopWindows as CastScreanIcon,
    CastConnected as ConnectIcon
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
        const { screen } = this.props
        const mobile = isMobile()

        return (
            <BottomNavigation
                showLabels={!mobile} className="main-navigation"
                value={screen}
                onChange={this.handleChange}
            >
                <BottomNavigationAction value="search" label="Search" icon={<SearchIcon />} />
                <BottomNavigationAction value="torrents" label="Torrents" icon={<TorrentsIcon />} />
                <BottomNavigationAction className='hide-on-desktop' value={this.handleConnect} label="Connect" icon={<ConnectIcon />} />
                <BottomNavigationAction className='hide-on-mobile' value="cast-screan" label="Cast Screan" icon={<CastScreanIcon />} />
            </BottomNavigation>
        )
    }
}

MainNavigation.propTypes = {
    screen: PropTypes.string.isRequired,
    onConnect: PropTypes.func.isRequired,
    goToScreen: PropTypes.func.isRequired
}

export default MainNavigation
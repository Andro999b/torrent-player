import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import TorrentsIcon from '@material-ui/icons/List'
import { isMobile } from '../utils'

class MainNavigation extends Component {
    render() {
        const { screen, goToScreen } = this.props
        const showLabels = !isMobile()

        return (
            <BottomNavigation
                showLabels={showLabels} className="main-navigation"
                value={screen}
                onChange={(e, screen) => goToScreen(screen)}
            >
                <BottomNavigationAction value="search" label="Search" icon={<SearchIcon />} />
                <BottomNavigationAction value="torrents" label="Torrents" icon={<TorrentsIcon />} />
            </BottomNavigation>
        )
    }
}

MainNavigation.propTypes = {
    screen: PropTypes.string.isRequired,
    goToScreen: PropTypes.func.isRequired
}

export default MainNavigation
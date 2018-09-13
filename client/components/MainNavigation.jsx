import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { 
    Search as SearchIcon,
    List as TorrentsIcon,
    DesktopWindows as CastScreanIcon
} from '@material-ui/icons'
import { isMobile } from '../utils'

class MainNavigation extends Component {
    render() {
        const { screen, goToScreen } = this.props
        const mobile = isMobile()

        return (
            <BottomNavigation
                showLabels={!mobile} className="main-navigation"
                value={screen}
                onChange={(e, screen) => goToScreen(screen)}
            >
                <BottomNavigationAction value="search" label="Search" icon={<SearchIcon />} />
                <BottomNavigationAction value="torrents" label="Torrents" icon={<TorrentsIcon />} />
                { !mobile && <BottomNavigationAction value="cast-screan" label="Cast Screan" icon={<CastScreanIcon />} /> }
            </BottomNavigation>
        )
    }
}

MainNavigation.propTypes = {
    screen: PropTypes.string.isRequired,
    goToScreen: PropTypes.func.isRequired
}

export default MainNavigation
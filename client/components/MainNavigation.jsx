import React, { Component } from 'react'

import BottomNavigation, { BottomNavigationAction } from 'material-ui/BottomNavigation'
import SearchIcon from 'material-ui-icons/Search'
import TorrentsIcon from 'material-ui-icons/List'
import PlayerIcon from 'material-ui-icons/MusicVideo'

class MainNavigation extends Component {
    render() {
        return (
            <BottomNavigation showLabels>
                <BottomNavigationAction label="search" icon={<SearchIcon/>}/>
                <BottomNavigationAction label="torrents" icon={<TorrentsIcon/>}/>
                <BottomNavigationAction label="player" icon={<PlayerIcon/>}/>
            </BottomNavigation>
        )
    }
}

export default MainNavigation
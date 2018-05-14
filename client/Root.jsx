import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MainNavigation from './components/MainNavigation'
import Notification from './components/Notification'

import SearchView from './views/SearchView'
import TorrentsView from './views/TorrentsView'
import PlayerView from './views/PlayerView'

import { observer, inject } from 'mobx-react'

@inject('transitionStore') @observer
class Root extends Component {
    render() {
        const { transitionStore } = this.props
        const { screen } = transitionStore

        let screanView
        switch (screen) {
            case 'search':
                screanView = <SearchView/>
                break
            case 'torrents':
                screanView = <TorrentsView/>
                break
            case 'player':
                screanView = <PlayerView/>
                break
        }

        return (
            <div>
                <div className='screan-content'>
                    {screanView}
                </div>
                <MainNavigation screen={screen} goToScreen={(screen) => transitionStore.goToScreen(screen)} />
                <Notification/>
            </div>
        )
    }
}

Root.propTypes = {
    transitionStore: PropTypes.object
}

export default Root
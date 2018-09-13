import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MainNavigation from './components/MainNavigation'
import Notification from './components/Notification'
import CastDialog from './components/CastDialog'

import SearchView from './views/SearchView'
import TorrentsView from './views/TorrentsView'
import PlayerView from './views/PlayerView'

import { observer, inject } from 'mobx-react'

@inject('transitionStore')
@observer
class Root extends Component {
    render() {
        const { transitionStore } = this.props
        const { screen } = transitionStore

        let screanView
        let navigation = true 

        switch (screen) {
            case 'search':
                screanView = <SearchView/>
                break
            case 'torrents':
                screanView = <TorrentsView/>
                break
            case 'player':
                screanView = <PlayerView/>
                navigation = false
                break
        }

        return (
            <div>
                <div className={ navigation ? 'screan-content' : 'screan-content_full' }>
                    {screanView}
                </div>
                {navigation && 
                    <MainNavigation 
                        screen={screen} 
                        goToScreen={(screen) => transitionStore.goToScreen(screen)}/>
                }
                <CastDialog/>
                <Notification/>
            </div>
        )
    }
}

Root.propTypes = {
    transitionStore: PropTypes.object
}

export default Root
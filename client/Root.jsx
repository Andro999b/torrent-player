import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MainNavigation from './components/MainNavigation'

import SearchView from './views/SearchView'
import TorrentsView from './views/TorrentsView'

import searchStore from './store/search-store'
import torrentsStore from './store/torrents-store'

import { observer } from 'mobx-react'

@observer
class Root extends Component {
    render() {
        const { navigationStore } = this.props
        const { screen } = navigationStore

        let screanView
        switch (screen) {
            case 'search':
                screanView = <SearchView searchStore={searchStore} />
                break
            case 'torrents':
                screanView = <TorrentsView torrentsStore={torrentsStore}/>
                break
        }

        return (
            <div>
                <div className='screan-content'>
                    {screanView}
                </div>
                <MainNavigation screen={screen} goToScreen={(screen) => navigationStore.goToScreen(screen)} />
            </div>
        )
    }
}

Root.propTypes = {
    navigationStore: PropTypes.object.isRequired
}

export default Root
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MainNavigation from './components/MainNavigation'
import Notification from './components/Notification'
import CastDialog from './components/CastDialog'

import SearchView from './views/SearchView'
import TorrentsView from './views/TorrentsView'
import PlayerView from './views/PlayerView'
import CastAwaitView from './views/CastAwaitView'

import { observer, inject } from 'mobx-react'

@inject('transitionStore', 'remoteControl')
@observer
class Root extends Component {
    handleGoToScreen = (screen) => {
        this.props.transitionStore.goToScreen(screen)
    }

    handleConnect = () => {
        this.props.transitionStore.showConnectToDeviceDialog()
    }

    render() {
        const { transitionStore: { screen }, remoteControl: { isCastAvaliable} } = this.props

        let screanView
        let navigation = true 

        switch (screen) {
            case 'torrents':
                screanView = <TorrentsView/>
                break
            case 'cast-screan':
                screanView = <CastAwaitView/>
                break
            case 'player':
                screanView = <PlayerView/>
                navigation = false
                break
            default:
                screanView = <SearchView/>
        }

        return (
            <div>
                <div className={ navigation ? 'screan-content' : 'screan-content_full' }>
                    {screanView}
                </div>
                {navigation && 
                    <MainNavigation 
                        screen={screen} 
                        goToScreen={this.handleGoToScreen}
                        onConnect={this.handleConnect}
                        isCastAvaliable={isCastAvaliable}
                    />
                }
                <CastDialog/>
                <Notification/>
            </div>
        )
    }
}

Root.propTypes = {
    transitionStore: PropTypes.object,
    remoteControl: PropTypes.object
}

export default Root
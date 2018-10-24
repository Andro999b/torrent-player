import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Notification from './components/Notification'

import PlayerView from './views/PlayerView'
import CastAwaitView from './views/CastAwaitView'

import { observer, inject } from 'mobx-react'

@inject('transitionStore')
@observer
class CastScreanRoot extends Component {
    handleGoToScreen = (screen) => {
        this.props.transitionStore.goToScreen(screen)
    }

    handleConnect = () => {
        this.props.transitionStore.showConnectToDeviceDialog()
    }

    render() {
        const { transitionStore: { screen } } = this.props

        let screanView

        switch (screen) {
            case 'player':
                screanView = <PlayerView/>
                break
            default:
                screanView = <CastAwaitView/>
        }

        return (
            <div>
                <div className={ 'screan-content_full' }>
                    {screanView}
                </div>
                <Notification/>
            </div>
        )
    }
}

CastScreanRoot.propTypes = {
    transitionStore: PropTypes.object,
}

export default CastScreanRoot
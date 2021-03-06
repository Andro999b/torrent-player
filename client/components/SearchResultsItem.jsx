import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { SEARCH_RPOVIDERS } from '../constants'

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    ExpansionPanelActions,
    CircularProgress,
    Button,
    Typography
} from '@material-ui/core'

import { 
    PlaylistAddRounded as AddToLibraryIcon,
    ExpandMore as ExpandIcon,
    WatchLaterOutlined as WatchLaterIcon
} from '@material-ui/icons'

import SearchResultsItemDetails from './SearchResultsItemDetails'
import ShowIf from './ShowIf'

import { observer, inject } from 'mobx-react'

import red from '@material-ui/core/colors/red'
import green from '@material-ui/core/colors/green'


@inject(({ libraryStore: { addTorrent, watchLater } }) => ({
    addTorrent, watchLater
}))
@observer
class SearchResultsItem extends Component {

    constructor(props, context) {
        super(props, context)
        this.state = {
            showDetails: false
        }
    }

    handleToggleDetails = () => {
        const { item } = this.props

        if (item.needLoadDetails())
            item.loadDetails()

        this.setState((prevState) => {
            return { showDetails: !prevState.showDetails }
        })
    }

    render() {
        const { item, watchLater, addTorrent } = this.props
        const { showDetails } = this.state

        const title =
            <div
                style={{ wordBreak: 'break-all' }}>
                [{SEARCH_RPOVIDERS[item.provider]}]&nbsp;
                { item.name }
            </div>

        const subheader =
            <div>
                {item.size && <span style={{ paddingRight: 4 }}>Size: {item.size}</span>}
                {item.seeds > 0 && <span style={{ color: green[500], paddingRight: 4 }}>Seeds: {item.seeds}</span>}
                {item.leechs > 0 && <span style={{ color: red[700] }}>Leechs: {item.leechs}</span>}
            </div>

        const content = item.loadingDetails ?
            (<div className="loading-center"><CircularProgress /></div>) :
            (
                item.loadingError ?
                    <Typography variant="body2" color='error'>{item.loadingError}</Typography> :
                    <div>
                        <ExpansionPanelDetails>
                            <SearchResultsItemDetails item={item} />
                        </ExpansionPanelDetails>
                        <ShowIf must={[item.isDownlodableTorrent()]}>
                            <ExpansionPanelActions>
                                <Button onClick={() => addTorrent(item.details)} variant="contained">
                                    <AddToLibraryIcon className="button-icon__left" />
                                    Add to Library
                                </Button>
                            </ExpansionPanelActions>
                        </ShowIf>
                        <ShowIf must={[item.hasFiles()]} mustNot={[item.isTorrent()]}>
                            <ExpansionPanelActions>
                                <Button onClick={() => watchLater(item.details)} variant="contained">
                                    <WatchLaterIcon className="button-icon__left"/>
                                    Watch Later
                                </Button>
                            </ExpansionPanelActions>
                        </ShowIf>
                    </div>
            )

        return (
            <ExpansionPanel expanded={showDetails} onChange={this.handleToggleDetails}>
                <ExpansionPanelSummary expandIcon={<ExpandIcon />} classes={{ content: 'expand-header' }}>
                    <div>
                        <Typography variant="h6" className='expand-header__row'>{title}</Typography>
                        <Typography variant='subtitle1' className='expand-header__row'>{subheader}</Typography>
                    </div>
                </ExpansionPanelSummary>
                {content}
            </ExpansionPanel>
        )
    }
}

SearchResultsItem.propTypes = {
    item: PropTypes.object.isRequired,
    addTorrent: PropTypes.func,
    watchLater: PropTypes.func
}

export default SearchResultsItem
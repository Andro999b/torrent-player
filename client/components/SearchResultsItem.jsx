import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    ExpansionPanelActions,
    CircularProgress,
    Button,
    Typography
} from '@material-ui/core'

import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined'
import ExpandIcon from '@material-ui/icons/ExpandMore'

import SearchResultsItemDetails from './SearchResultsItemDetails'

import { observer, inject } from 'mobx-react'

import red from '@material-ui/core/colors/red'
import green from '@material-ui/core/colors/green'


@inject(({ transitionStore: { download } }) => ({
    onDownload: download
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
        const { item, onDownload } = this.props
        const { showDetails } = this.state

        const title =
            <div
                style={{ wordBreak: 'break-all' }}>
                { (item.details && item.details.name) || item.name }
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
                    <Typography color='error'>{item.loadingError}</Typography> :
                    <div>
                        <ExpansionPanelDetails>
                            <SearchResultsItemDetails details={item.details} />
                        </ExpansionPanelDetails>
                        {item.isDownlodableTorrent() && <ExpansionPanelActions>
                            <Button onClick={() => onDownload(item.details)} variant="contained">
                                Download Torrent
                                <DownloadIcon />
                            </Button>
                        </ExpansionPanelActions>}
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
    onDownload: PropTypes.func
}

export default SearchResultsItem
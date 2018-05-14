import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import ExpansionPanel, { ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions } from 'material-ui/ExpansionPanel'
import { CircularProgress } from 'material-ui/Progress'
import ExpandIcon from 'material-ui-icons/ExpandMore'
import SearchResultsItemDetails from './SearchResultsItemDetails'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import DownloadIcon from 'material-ui-icons/FileDownload'
import { observer, inject } from 'mobx-react'

import red from 'material-ui/colors/red'
import green from 'material-ui/colors/green'


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

    handleToggleDetails() {
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
                {item.name}
            </div>

        const subheader = 
            <div>
                {item.size && <span>Size: {item.size}&nbsp;</span>}
                {item.seeds > 0 && <span style={{ color: green[500] }}>Seeds: {item.seeds}&nbsp;</span>}
                {item.leechs > 0 && <span style={{ color: red[700] }}>Leechs: {item.leechs}</span>}
            </div>

        const content = item.loadingDetails ?
            (<div className="loading-center"><CircularProgress /></div>) :
            (
                item.loadingError ?
                    <Typography color='error'>{item.loadingError}</Typography> :
                    <Fragment>
                        <ExpansionPanelDetails>
                            <SearchResultsItemDetails details={item.details} />
                        </ExpansionPanelDetails>
                        <ExpansionPanelActions>
                            <Button onClick={() => onDownload(item.details)} variant="raised">
                                Download Torrent
                                <DownloadIcon />
                            </Button>
                        </ExpansionPanelActions>
                    </Fragment>
            )

        return (
            <ExpansionPanel expanded={showDetails} onChange={this.handleToggleDetails.bind(this)}>
                <ExpansionPanelSummary expandIcon={<ExpandIcon />} classes={{ content: 'expand-header' }}>
                    <Typography variant='title' className='expand-header__row'>{title}</Typography>
                    <Typography variant='subheading' className='expand-header__row'>{subheader}</Typography>
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
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Card, { CardHeader, CardContent } from 'material-ui/Card'
import Collapse from 'material-ui/transitions/Collapse'
import { CircularProgress } from 'material-ui/Progress'
import IconButton from 'material-ui/IconButton'
import ExpandIcon from 'material-ui-icons/ExpandMore'
import SearchResultsItemDetails from './SearchResultsItemDetails'
import Typography from 'material-ui/Typography'
import { observer } from 'mobx-react'

import red from 'material-ui/colors/red'
import green from 'material-ui/colors/green'

@observer
class SearchResultsItem extends Component {

    constructor(props, context) {
        super(props, context)
        this.state = {
            showDetails: false
        }
    }

    onToggleDetails() {
        const { item } = this.props

        if(item.needLoadDetails())
            item.loadDetails()

        this.setState((prevState) => {
            return { showDetails: !prevState.showDetails }
        })
    }

    render() {
        const { item } = this.props
        const { showDetails } = this.state

        const subheader = (
            <div>
                {item.size && <span>Size: {item.size}&nbsp;</span>}
                {item.seeds > 0 && <span style={{ color: green[500] }}>Seeds: {item.seeds}&nbsp;</span>}
                {item.leechs > 0 && <span style={{ color: red[700] }}>Leechs: {item.leechs}</span>}
            </div>
        )

        const content = item.loadingDetails ?
            (<div className="loading-center"><CircularProgress /></div>) :
            (
                item.loadingError ?
                    (<Typography color='error'>{item.loadingError}</Typography>) :
                    (<SearchResultsItemDetails details={item.details} />)
            )

        return (
            <Card className="search-results-item">
                <CardHeader
                    title={<div style={{ wordBreak: 'break-all' }}>{item.title}</div>}
                    subheader={subheader}
                    action={
                        <IconButton onClick={this.onToggleDetails.bind(this)} className={classnames('expand', {'expandOpen': showDetails})}>
                            <ExpandIcon/>
                        </IconButton>
                    }
                />
                <Collapse in={showDetails} unmountOnExit>
                    <CardContent>
                        {content}
                    </CardContent>
                </Collapse>
            </Card>
        )
    }
}

SearchResultsItem.propTypes = {
    item: PropTypes.object.isRequired,
}

export default SearchResultsItem
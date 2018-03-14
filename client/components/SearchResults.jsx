import React, { Component } from 'react'
import SearchResultsItem from './SearchResultsItem'
import Typography from 'material-ui/Typography'
import PropTypes from 'prop-types'

class SearchResults extends Component {
    render() {
        const { results } = this.props

        return (
            <div className="search-results">
                {results.length == 0 && <Typography align="center" variant="display1">Nothing to display</Typography>}
                {results.map((item) =>
                    (<SearchResultsItem key={`${item.provider}_${item.torrent}`} item={item}/>)
                )}
            </div>
        )
    }
}

SearchResults.propTypes = {
    results: PropTypes.object.isRequired
}

export default SearchResults
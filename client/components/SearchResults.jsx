import React, { Component } from 'react'
import SearchResultsItem from './SearchResultsItem'
import Typography from 'material-ui/Typography'
import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroller'

const PAGE_SIZE = 10

class SearchResults extends Component {

    constructor(props, context) {
        super(props, context)

        const results = this.props.results
        this.state = {
            items: results.slice(0, PAGE_SIZE),
            hasMore: PAGE_SIZE < results.length
        }
    }

    loadMoreItems(page) {
        const results = this.props.results
        const end = (page + 1) * PAGE_SIZE
        const hasMore = end < results.length

        this.setState({
            items: results.slice(0, end),
            hasMore
        })
    }

    render() {
        const { items, hasMore } = this.state

        return (
            <div className="search-results">
                {items.length == 0 && <Typography align="center" variant="display1">Nothing to display</Typography>}
                <InfiniteScroll
                    pageStart={0}
                    loadMore={this.loadMoreItems.bind(this)}
                    hasMore={hasMore}
                    useWindow={false}
                >
                    {items.map((item) =>
                        (<SearchResultsItem key={`${item.provider}_${item.torrent}`} item={item} />)
                    )}
                </InfiniteScroll>
            </div>
        )
    }
}

SearchResults.propTypes = {
    results: PropTypes.object.isRequired
}

export default SearchResults
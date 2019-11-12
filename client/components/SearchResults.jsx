import React, { Component } from 'react'
import SearchResultsItem from './SearchResultsItem'

import Typography from '@material-ui/core/Typography'

import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroller'

import memoize from 'memoize-one'

import { observer } from 'mobx-react'

const PAGE_SIZE = 10

@observer
class SearchResults extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            page: 0,
        }
    }

    nextPage = () => this.setState((state) => 
        ({ page:  state.page + 1 })
    )

    getPage = memoize((results, page) => {
        const end = (page + 1) * PAGE_SIZE
        const hasMore = end < results.length

        return {
            items: results.slice(0, end),
            hasMore
        }
    })

    render() {
        const { page } = this.state
        const { results } = this.props

        const { items, hasMore } = this.getPage(results.slice(), page)

        return (
            <div className="search-results">
                {items.length == 0 && <Typography align="center" variant="h4">Nothing to display</Typography>}
                <InfiniteScroll
                    pageStart={0}
                    loadMore={this.nextPage}
                    hasMore={hasMore}
                    useWindow={false}
                >
                    {items.map((item) =>
                        (<SearchResultsItem key={`${item.provider}_${item.id}`} item={item} />)
                    )}
                </InfiniteScroll>
            </div>
        )
    }
}

SearchResults.propTypes = {
    results: PropTypes.array.isRequired
}

export default SearchResults
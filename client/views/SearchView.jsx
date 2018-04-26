import React, { Component } from 'react'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'
import { CircularProgress } from 'material-ui/Progress'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

@inject('searchStore') @observer
class SearchView extends Component {
    render() {
        const { searchStore } = this.props
        const { suggestions, searchResults, loading } = searchStore

        return (
            <div className="search-view">
                <SearchBar
                    onInput={(q) => searchStore.suggest(q)}
                    onSubmit={(q) => searchStore.search(q)}
                    suggestions={suggestions}
                />
                { loading && <div className="loading-center"><CircularProgress/></div> }
                { !loading && <SearchResults results={searchResults} /> }
            </div>
        )
    }
}

SearchView.propTypes = {
    searchStore: PropTypes.object
}

export default SearchView
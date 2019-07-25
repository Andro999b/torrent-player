import React, { Component } from 'react'
import Autosuggest from 'react-autosuggest'
import SearchBarSettings from './SearchBarSettings'

import {
    Paper,
    Input,
    InputAdornment,
    List,
    ListItemIcon,
    Collapse,
    IconButton,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@material-ui/core'

import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Restore as HistoryIcon,
    Delete as DeleteIcon,
} from '@material-ui/icons'

import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import { toJS } from 'mobx'

function renderInput(inputProps) {
    return <Input fullWidth {...inputProps} />
}

function renderSuggestionsContainer({ containerProps, children, query }) { // eslint-disable-line
    return (
        <Collapse in={children && query != ''}>
            <List {...containerProps} component="div">{children}</List>
        </Collapse>
    )
}

class SearchBar extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            searchQuery: ''
        }
        this.onInput = debounce(this.handleInput.bind(this), 200)
    }

    handleInput = ({ value }) => {
        this.props.onInput(value)
    }

    handleChange = (e, { newValue }) => {
        this.setState({ searchQuery: newValue })
    }

    handleClean = () => {
        const searchQuery = ''
        this.props.onInput(searchQuery)
        this.setState({ searchQuery })
    }

    handleCleanSuggestions = () => {
        this.props.onInput('')
    }

    handleKeyDown = (e) => {
        if (e.key == 'Enter') {
            this.handleSubmit(this.state.searchQuery)
        }
    }

    handleSubmit = (searchQuery) => {
        this.props.onSubmit(searchQuery)
        this.lastSearchQuery = searchQuery
    }

    renderSuggestion = (suggestion, { isHighlighted }) => {
        const { onRemoveHistory } = this.props

        return (
            <ListItem selected={isHighlighted} component="div" ContainerComponent="div">
                {suggestion.history && <ListItemIcon>
                    <HistoryIcon/>
                </ListItemIcon>}
                <ListItemText primary={suggestion.text}/>
                {suggestion.history && <ListItemSecondaryAction>
                    <IconButton onClick={(e) => {
                        onRemoveHistory(suggestion)
                        e.stopPropagation()
                    }}> 
                        <DeleteIcon/>
                    </IconButton>
                </ListItemSecondaryAction>}
            </ListItem>
        )
    }

    render() {
        const { searchQuery } = this.state
        const { suggestions, searchProviders, onSelectProviders } = this.props

        return (
            <Paper className="search-bar">
                <Autosuggest
                    renderInputComponent={renderInput}
                    focusInputOnSuggestionClick={false}
                    suggestions={toJS(suggestions)}
                    onSuggestionsFetchRequested={this.handleInput}
                    onSuggestionsClearRequested={this.handleCleanSuggestions}
                    onSuggestionSelected={(e, { suggestion }) =>
                        this.handleSubmit(suggestion.text)
                    }
                    renderSuggestionsContainer={renderSuggestionsContainer}
                    getSuggestionValue={(suggestion) => suggestion.text}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={{
                        disableUnderline: true,
                        fullWidth: true,
                        autoFocus: true,
                        placeholder: 'Type for search',
                        value: searchQuery,
                        onKeyDown: this.handleKeyDown,
                        onChange: this.handleChange,
                        startAdornment: (
                            <InputAdornment>
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment>
                                <IconButton onClick={this.handleClean}>
                                    <ClearIcon />
                                </IconButton>
                                <SearchBarSettings
                                    searchProviders={searchProviders}
                                    onSelectProviders={onSelectProviders}
                                />
                            </InputAdornment>
                        )
                    }}
                />
            </Paper>
        )
    }
}

SearchBar.propTypes = {
    searchProviders: PropTypes.array.isRequired,
    onInput: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onSelectProviders: PropTypes.func.isRequired,
    onRemoveHistory: PropTypes.func.isRequired,
    suggestions: PropTypes.array.isRequired
}

export default SearchBar

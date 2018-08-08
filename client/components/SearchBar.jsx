import React, { Component } from 'react'
import Autosuggest from 'react-autosuggest'
import { SEARCH_RPVODERS, SEARCH_RPVODERS_NAME } from '../contants'

import {
    Paper,
    Input,
    InputAdornment,
    Menu,
    MenuList,
    MenuItem,
    Collapse,
    IconButton,
    ListItemText,
    Checkbox
} from '@material-ui/core'

import SearchIcon from '@material-ui/icons/Search'
import ClearIcon from '@material-ui/icons/Clear'
import MoreIcon from '@material-ui/icons/MoreVert'

import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import { toJS } from 'mobx'

function renderInput(inputProps) {
    const { ref, ...other } = inputProps

    return <Input fullWidth ref={ref} {...other} />
}

function renderSuggestion(suggestion, { isHighlighted }) {
    return (
        <MenuItem selected={isHighlighted} component="div">
            {suggestion}
        </MenuItem>
    )
}

function renderSuggestionsContainer(options) {
    const { containerProps, children, query } = options

    return (
        <Collapse in={children && query != ''}>
            <MenuList {...containerProps}>{children}</MenuList>
        </Collapse>
    )
}

class SearchBar extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            searchQuery: '',
            settingsAnchorEl: null
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

    handleOpenSettings = (event) => {
        this.setState({ settingsAnchorEl: event.currentTarget })
    }

    handleCloseSettings = () => {
        this.setState({ settingsAnchorEl: null })
    }

    toggleProvider(provider) {
        const { searchProviders, onSelectProviders } = this.props

        const index = searchProviders.indexOf(provider)
        if (index != -1) {
            onSelectProviders(searchProviders.filter((v, i) => i != index))
        } else {
            onSelectProviders(searchProviders.concat([provider]))
        }
    }

    renderSettings() {
        const { props: { searchProviders }, state: { settingsAnchorEl } } = this
        return (
            <Menu anchorEl={settingsAnchorEl}
                open={settingsAnchorEl != null}
                onClose={this.handleCloseSettings.bind(this)}>
                {SEARCH_RPVODERS.map((provider) => (
                    <MenuItem key={provider} onClick={() => this.toggleProvider(provider)}>
                        <Checkbox disableRipple checked={searchProviders.indexOf(provider) != -1} />
                        <ListItemText primary={SEARCH_RPVODERS_NAME[provider]} />
                    </MenuItem>
                ))}
            </Menu>
        )
    }

    render() {
        const { searchQuery } = this.state
        const { suggestions } = this.props
        return (
            <Paper className="search-bar">
                <Autosuggest
                    renderInputComponent={renderInput}
                    suggestions={toJS(suggestions)}
                    onSuggestionsFetchRequested={this.handleInput}
                    onSuggestionsClearRequested={this.handleCleanSuggestions}
                    onSuggestionSelected={(e, { suggestion }) =>
                        this.handleSubmit(suggestion)
                    }
                    renderSuggestionsContainer={renderSuggestionsContainer}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={renderSuggestion}
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
                                <IconButton
                                    onClick={this.handleClean}
                                >
                                    <ClearIcon />
                                </IconButton>
                                <IconButton onClick={this.handleOpenSettings} >
                                    <MoreIcon />
                                </IconButton>
                                {this.renderSettings()}
                            </InputAdornment>
                        )
                    }}
                />
            </Paper>
        )
    }
}

SearchBar.propTypes = {
    searchProviders: PropTypes.object.isRequired,
    onInput: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onSelectProviders: PropTypes.func.isRequired,
    suggestions: PropTypes.object.isRequired
}

export default SearchBar

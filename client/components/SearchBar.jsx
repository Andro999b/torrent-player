import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Autosuggest from 'react-autosuggest';
import Input, { InputAdornment } from 'material-ui/Input'
import { MenuList, MenuItem } from 'material-ui/Menu'
import Collapse from 'material-ui/transitions/Collapse'
import { IconButton } from 'material-ui'
import SearchIcon from 'material-ui-icons/Search'
import ClearIcon from 'material-ui-icons/Clear'
import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import { toJS } from 'mobx'

function renderInput(inputProps) {
    const { ref, ...other } = inputProps

    return (
        <Input
            fullWidth
            ref={ref}
            {...other}
        />
    )
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
            <MenuList {...containerProps}>
                {children}
            </MenuList>
        </Collapse>
    )
}

class SearchBar extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            searchQuery: ''
        }
        this.onInput = debounce(this.onInput.bind(this), 200)
    }

    onInput({ value }) {
        this.props.onInput(value)
    }

    onChange(e, { newValue }) {
        this.setState({ searchQuery: newValue })
    }

    onClean() {
        const searchQuery = ''
        this.props.onInput(searchQuery)
        this.setState({ searchQuery })
    }

    onKeyDown(e) {
        if (e.key == 'Enter') {
            this.onSubmit(this.state.searchQuery)
        }
    }

    onSubmit(searchQuery) {
        this.props.onInput('')
        this.props.onSubmit(searchQuery)
        this.setState({ searchQuery: '' })
        this.lastSearchQuery = searchQuery
    }

    render() {
        const { searchQuery } = this.state
        const { suggestions } = this.props

        return (
            <Paper className='search-bar'>
                <Autosuggest
                    renderInputComponent={renderInput}
                    suggestions={toJS(suggestions)}
                    onSuggestionsFetchRequested={this.onInput.bind(this)}
                    onSuggestionsClearRequested={this.onClean.bind(this)}
                    onSuggestionSelected={(e, { suggestion }) => this.onSubmit(suggestion)}
                    renderSuggestionsContainer={renderSuggestionsContainer}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={renderSuggestion}
                    inputProps={{
                        disableUnderline: true,
                        fullWidth: true,
                        autoFocus: true,
                        placeholder: 'Type for search',
                        value: searchQuery,
                        onKeyDown: this.onKeyDown.bind(this),
                        onChange: this.onChange.bind(this),
                        startAdornment: (
                            <InputAdornment>
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment>
                                <IconButton onClick={this.onClean.bind(this)}>
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }} />
            </Paper>
        )
    }
}

SearchBar.propTypes = {
    onInput: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    suggestions: PropTypes.object.isRequired,
}

export default SearchBar
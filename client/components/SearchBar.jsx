import React, { Component } from 'react'
import Autosuggest from 'react-autosuggest'
import { SEARCH_RPVODERS, SEARCH_RPVODERS_NAME } from '../constants'

import {
    Paper,
    Input,
    InputAdornment,
    Menu,
    List,
    MenuItem,
    ListItemIcon,
    Collapse,
    IconButton,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Checkbox
} from '@material-ui/core'

import {
    Search as SearchIcon,
    Clear as ClearIcon,
    MoreVert as MoreIcon,
    Restore as HistoryIcon,
    Delete as DeleteIcon
} from '@material-ui/icons'

import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import { toJS } from 'mobx'

function renderInput(inputProps) {
    return <Input fullWidth {...inputProps} />
}

function renderSuggestionsContainer({ containerProps, children, query }) {
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

    handleClearProviders = () => this.props.onSelectProviders([])

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
                <MenuItem onClick={this.handleClearProviders} style={{'justifyContent': 'center'}}>
                    Deselect All
                </MenuItem>
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
    searchProviders: PropTypes.array.isRequired,
    onInput: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onSelectProviders: PropTypes.func.isRequired,
    onRemoveHistory: PropTypes.func.isRequired,
    suggestions: PropTypes.array.isRequired
}

export default SearchBar

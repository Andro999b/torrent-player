import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import { 
    SEARCH_RPVODERS, 
    SEARCH_RPVODERS_NAME,
    SEARCH_RPVODERS_PRESET,
    SEARCH_RPVODERS_PRESET_NAMES
} from '../constants'

import {
    Menu,
    MenuList,
    Collapse,
    MenuItem,
    ListItemText,
    Checkbox,
    IconButton
} from '@material-ui/core'

import {
    MoreVert as MoreIcon,
    ExpandLess,
    ExpandMore
} from '@material-ui/icons'

class SearchBarSettings extends Component {
    constructor(props, context) {
        super(props, context)
        
        this.state = {
            anchorEl: null,
            openCustom: false
        }
    }
    
    handleToggleCustom = () => {
        this.setState((state) => ({ openCustom: !state.openCustom }))
    };

    handleOpenSettings = (event) => {
        this.setState({ anchorEl: event.currentTarget })
    }

    handleCloseSettings = () => {
        this.setState({ anchorEl: null })
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
    selectPreset = (preset) => this.props.onSelectProviders(preset)

    handleClearProviders = () => this.props.onSelectProviders([])
    handleAllProviders = () => this.props.onSelectProviders(SEARCH_RPVODERS)

    renderPresets(searchProviders) {
        return (
            Object.keys(SEARCH_RPVODERS_PRESET).map((presetName) => {
                const preset = SEARCH_RPVODERS_PRESET[presetName]
                const pesetLabel = SEARCH_RPVODERS_PRESET_NAMES[presetName]
                let count = preset.reduce((counter, provider) => 
                    searchProviders.includes(provider) ? counter + 1 : counter
                , 0)
                return (
                    <MenuItem
                        button 
                        key={presetName} 
                        onClick={() => this.selectPreset(preset)}
                        selected={count == preset.length}
                    >
                        {pesetLabel}
                    </MenuItem>
                )
            })
        )
    }

    render() {
        const { props: { searchProviders }, state: { anchorEl, openCustom } } = this
        return (
            <Fragment>
                <IconButton onClick={this.handleOpenSettings} >
                    <MoreIcon />
                </IconButton>
                <Menu 
                    anchorEl={anchorEl}
                    disableAutoFocusItem
                    open={anchorEl != null}
                    onClose={this.handleCloseSettings.bind(this)}>
                    <div style={{ width: 270 }}>
                        {/* Providers Presets */}
                        {this.renderPresets(searchProviders)}
                        {/* Custom providres */}
                        <MenuItem onClick={this.handleToggleCustom}>
                            <ListItemText primary="Providers" />
                            {openCustom ? <ExpandLess /> : <ExpandMore />}
                        </MenuItem>
                        <Collapse in={openCustom} timeout="auto" unmountOnExit>
                            <MenuList>
                                <MenuItem onClick={this.handleClearProviders}>
                                    Deselect All
                                </MenuItem>
                                {/* List of all providers */}
                                {SEARCH_RPVODERS.map((provider) => (
                                    <MenuItem key={provider} onClick={() => this.toggleProvider(provider)}>
                                        <Checkbox color="primary" disableRipple checked={searchProviders.indexOf(provider) != -1} />
                                        <ListItemText primary={SEARCH_RPVODERS_NAME[provider]} />
                                    </MenuItem>
                                ))}
                                {/* Select all providers */}
                                <MenuItem onClick={this.handleAllProviders}>
                                    Select All
                                </MenuItem>
                                {/* Deselect all providers */}
                                
                            </MenuList>
                        </Collapse>
                    </div>
                </Menu>
            </Fragment>
        )
    }
}

SearchBarSettings.propTypes = {
    searchProviders: PropTypes.array.isRequired,
    onSelectProviders: PropTypes.func.isRequired
}

export default SearchBarSettings
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import { 
    SEARCH_RPOVIDERS, 
    SEARCH_RPVODERS_PRESET
} from '../constants'

import {
    Menu,
    MenuList,
    Collapse,
    MenuItem,
    ListItemText,
    Checkbox,
    IconButton,
    ListSubheader
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
            onSelectProviders(searchProviders.filter((_, i) => i != index))
        } else {
            onSelectProviders(searchProviders.concat([provider]))
        }
    }

    selectPreset = (preset) => this.props.onSelectProviders(preset)
    handleClearProviders = () => this.props.onSelectProviders([])
    handleAllProviders = () => this.props.onSelectProviders(Object.keys(SEARCH_RPOVIDERS))

    renderPreset(searchProviders, preset, inset) {
        let count = preset.providers.reduce(
            (counter, provider) => searchProviders.includes(provider) ? counter + 1 : counter, 
            0
        )

        return (
            <MenuItem
                button
                key={preset.name}
                className={ inset ? 'inset' : ''}
                onClick={() => this.selectPreset(preset.providers)}
                selected={count == preset.providers.length}
            >
                {preset.name}
            </MenuItem>
        )
    }

    renderPresets(searchProviders) {
        return SEARCH_RPVODERS_PRESET.map((preset) => {
            if(preset.presets) {
                return (
                    <MenuList 
                        key={preset.name} 
                        subheader={<ListSubheader disableSticky>{preset.name}</ListSubheader>}
                    >
                        {preset.presets.map((item) => 
                            this.renderPreset(searchProviders, item, true))
                        }
                    </MenuList>
                )
            } else {
                return this.renderPreset(searchProviders, preset)
            }
        })
    }

    renderProviders(searchProviders) {
        const { openCustom } = this.state

        return(
            <Fragment>
                <MenuItem onClick={this.handleToggleCustom}>
                    <ListItemText primary="Providers" />
                    {openCustom ? <ExpandLess /> : <ExpandMore />}
                </MenuItem>
                <Collapse in={openCustom} timeout="auto" unmountOnExit component="li">
                    <MenuList>
                        <MenuItem onClick={this.handleClearProviders}>
                            Deselect All
                        </MenuItem>
                        {/* List of all providers */}
                        {Object.keys(SEARCH_RPOVIDERS).map((provider) => (
                            <MenuItem key={provider} onClick={() => this.toggleProvider(provider)}>
                                <Checkbox color="primary" disableRipple checked={searchProviders.indexOf(provider) != -1} />
                                <ListItemText primary={SEARCH_RPOVIDERS[provider]} />
                            </MenuItem>
                        ))}
                        {/* Select all providers */}
                        <MenuItem onClick={this.handleAllProviders}>
                            Select All
                        </MenuItem>
                        {/* Deselect all providers */}
                    </MenuList>
                </Collapse>
            </Fragment>
        )
    }

    render() {
        const { props: { searchProviders }, state: { anchorEl } } = this
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
                        {this.renderProviders(searchProviders)}
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
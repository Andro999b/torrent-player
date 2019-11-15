import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Tooltip, IconButton } from '@material-ui/core'
import WarningIcon from '@material-ui/icons/Warning'
import { observer } from 'mobx-react'

@observer
class SearchProxyStatus extends Component {
    render() {
        const { proxyStatus: { searching, url, region } } = this.props

        const text = searching ?
            `Searching proxy server for region "${region.toUpperCase()}"` :
            ( url ?`Using proxy server ${url}`: 'No proxy found' )

        return (
            <Tooltip title={text}>
                <IconButton disableRipple>
                    <WarningIcon/>
                </IconButton>
            </Tooltip>
        )
    }
}

SearchProxyStatus.propTypes = {
    proxyStatus: PropTypes.object,
}

export default SearchProxyStatus

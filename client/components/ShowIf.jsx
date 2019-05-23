import React from 'react'
import PropTypes from 'prop-types'

class ShowIf extends React.Component {
    render() {
        const { must, mustNot, children } = this.props

        let shouldRender = true
        for(const con of must) {
            if(!con) {
                shouldRender = false
                break
            }
        }

        if(shouldRender) {
            for(const con of mustNot) {
                if(con) {
                    shouldRender = false
                    break
                }
            }
        }

        return shouldRender ? children : null
    }
}

ShowIf.defaultProps = {
    must: [],
    mustNot: [],
}

ShowIf.propTypes = {
    must: PropTypes.array,
    mustNot: PropTypes.array,
    children: PropTypes.oneOfType(
        [
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node
        ]
    ).isRequired
}

export default ShowIf
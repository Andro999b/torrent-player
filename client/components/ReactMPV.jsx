import React from 'react'
import PropTypes from 'prop-types'


/**
 * Part of MPV.JS project
 * @see: https://github.com/Kagami/mpv.js
 */

const PLUGIN_MIME_TYPE = 'application/x-mpvjs'

class ReactMPV extends React.PureComponent {
    /**
     * Send a command to the player.
     *
     * @param {string} cmd - Command name
     * @param {...*} args - Arguments
     */
    command(cmd, ...args) {
        args = args.map((arg) => arg.toString())
        this._postData('command', [cmd].concat(args))
    }

    /**
     * Set a property to a given value.
     *
     * @param {string} name - Property name
     * @param {*} value - Property value
     */
    property(name, value) {
        const data = { name, value }
        this._postData('set_property', data)
    }

    /**
     * Get a notification whenever the given property changes.
     *
     * @param {string} name - Property name
     */
    observe(name) {
        this._postData('observe_property', name)
    }

    /**
     * Send a key event through mpv's input handler, triggering whatever
     * behavior is configured to that key.
     *
     * @param {KeyboardEvent} event
     */
    keypress({ key, shiftKey, ctrlKey, altKey }) {
        // Don't need modifier events.
        if ([
            'Escape', 'Shift', 'Control', 'Alt',
            'Compose', 'CapsLock', 'Meta',
        ].includes(key)) return

        if (key.startsWith('Arrow')) {
            key = key.slice(5).toUpperCase()
            if (shiftKey) {
                key = `Shift+${key}`
            }
        }
        if (ctrlKey) {
            key = `Ctrl+${key}`
        }
        if (altKey) {
            key = `Alt+${key}`
        }

        // Ignore exit keys for default keybindings settings.
        if ([
            'q', 'Q', 'ESC', 'POWER', 'STOP',
            'CLOSE_WIN', 'CLOSE_WIN', 'Ctrl+c',
            'AR_PLAY_HOLD', 'AR_CENTER_HOLD',
        ].includes(key)) return

        this.command('keypress', key)
    }

    /**
     * Enter fullscreen.
     */
    fullscreen() {
        this.node().webkitRequestFullscreen()
    }

    /**
     * Synchronously destroy mpv instance. You might want to call this on
     * quit in order to cleanup files currently being opened in mpv.
     */
    destroy() {
        this.node().remove()
    }

    /**
     * Return a plugin DOM node.
     *
     * @return {HTMLEmbedElement}
     */
    node() {
        return this.plugin
    }

    constructor(props) {
        super(props)
        this.plugin = null
    }
    _postData(type, data) {
        const msg = { type, data }
        this.node().postMessage(msg)
    }
    _handleMessage(e) {
        const msg = e.data
        const { type, data } = msg
        if (type === 'property_change' && this.props.onPropertyChange) {
            const { name, value } = data
            this.props.onPropertyChange(name, value)
        } else if (type === 'ready' && this.props.onReady) {
            this.props.onReady(this)
        }
    }
    componentDidMount() {
        this.node().addEventListener('message', this._handleMessage.bind(this))
    }
    render() {
        const defaultStyle = { display: 'block', width: '100%', height: '100%' }
        const props = Object.assign({}, this.props, {
            ref: (el) => {
                this.plugin = el 
},
            type: PLUGIN_MIME_TYPE,
            style: Object.assign(defaultStyle, this.props.style),
        })
        delete props.onReady
        delete props.onPropertyChange
        return React.createElement('embed', props)
    }
}

/**
 * Accepted properties. Other properties (not documented) are applied to
 * the plugin element.
 */
ReactMPV.propTypes = {
    /**
     * The CSS class name of the plugin element.
     */
    className: PropTypes.string,
    /**
     * Override the inline-styles of the plugin element.
     */
    style: PropTypes.object,
    /**
     * Callback function that is fired when mpv is ready to accept
     * commands.
     *
     * @param {Object} mpv - Component instance
     */
    onReady: PropTypes.func,
    /**
     * Callback function that is fired when one of the observed properties
     * changes.
     *
     * @param {string} name - Property name
     * @param {*} value - Property value
     */
    onPropertyChange: PropTypes.func,
}

export default ReactMPV
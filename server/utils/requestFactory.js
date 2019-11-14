const superagent = require('superagent')
const { HTTP_PROXY } = require('../config')

const defaultOptions = {
    charset: true,
    proxy: false
}

module.exports = (options) => {
    const effectiveOptions = Object.assign(defaultOptions, options)

    if (effectiveOptions.charset)
        require('superagent-charset')(superagent)

    if (effectiveOptions.proxy) {
        require('superagent-proxy')(superagent)

        let proxy
        if (HTTP_PROXY) {
            proxy = HTTP_PROXY
        }

        if (proxy) {
            const methods = ['get', 'post']
            return methods.reduce((acc, method) => {
                acc[method] = (url) => {
                    return superagent[method](url).proxy(proxy)
                }
                return acc;
            }, {})
        }
    }

    return superagent
}
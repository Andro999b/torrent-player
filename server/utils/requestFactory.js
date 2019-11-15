const superagent = require('superagent')
const { USE_PROXY, USE_PROXY_REGION } = require('../config')
const proxyList = require('../service/proxiesList')

let proxy

if (USE_PROXY) {
    proxy = USE_PROXY
} else if(USE_PROXY_REGION) {
    proxyList(USE_PROXY_REGION).then((proxies) => {
        proxy = proxies.pop()
        console.log(`Selected proxy server ${proxy} for region ${USE_PROXY_REGION}`) // eslint-disable-line no-console
    })
}

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

        if (proxy) {
            const methods = ['get', 'post']
            return methods.reduce((acc, method) => {
                acc[method] = (url) => {
                    // console.log(`Using proxy ${proxy} for request [${method}]: ${url}`)
                    return superagent[method](url).proxy(proxy)
                }
                return acc
            }, {})
        }
    }

    return superagent
}
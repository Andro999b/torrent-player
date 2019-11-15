const superagent = require('superagent')
const { USE_PROXY, USE_PROXY_REGION, PROXY_CHECK_URL, PROXY_CHECK_TIMEOUT } = require('../config')
const proxiesList = require('../service/proxiesList')

require('superagent-charset')(superagent)
require('superagent-proxy')(superagent)

let proxyUrl
let searching = false

if (USE_PROXY) {
    proxyUrl = USE_PROXY
} else {
    updateProxy()
}

function updateProxy() {
    if (USE_PROXY_REGION && !searching) {
        searching = true
        proxiesList.findProxy(USE_PROXY_REGION, PROXY_CHECK_URL, PROXY_CHECK_TIMEOUT)
            .then((selectedProxy) => {
                searching = false
                proxyUrl = selectedProxy
                if (proxyUrl) {
                    console.log(`Selected proxy server ${proxyUrl} for region ${USE_PROXY_REGION}`) // eslint-disable-line no-console
                } else {
                    console.log(`Have not found any proxy server for region ${USE_PROXY_REGION}`) // eslint-disable-line no-console
                }
            }).catch((e) => {
                console.error('Fail to get proxy', e)
            })
    }
}

function getProxyStatus() {
    return {
        enabled: USE_PROXY || USE_PROXY_REGION != null,
        url: proxyUrl,
        region: USE_PROXY_REGION,
        searching
    }
}

const defaultOptions = {
    proxy: false
}

module.exports = (options) => {
    const effectiveOptions = Object.assign(defaultOptions, options)


    if (effectiveOptions.proxy) {
        if (proxyUrl) {
            const methods = ['get', 'post']
            return methods.reduce((acc, method) => {
                acc[method] = (url) => {
                    // console.log(`Using proxy ${proxy} for request [${method}]: ${url}`)
                    return superagent[method](url).proxy(proxyUrl)
                }
                return acc
            }, {})
        }
    }

    return superagent
}

module.exports.updateProxy = () => {
    updateProxy()
    return getProxyStatus()
}
module.exports.getProxyStatus = getProxyStatus
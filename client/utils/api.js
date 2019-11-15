import superagent from 'superagent'
import urljoin from 'url-join'

const superagentAbsolute = (agent) => {
    const OVERRIDE = 'delete,get,head,patch,post,put'.split(',')
    return (baseUrl) => (
        new Proxy(agent, {
            get(target, propertyName) {
                return (...params) => {
                    if (OVERRIDE.indexOf(propertyName) !== -1
                        && params.length > 0
                        && typeof params[0] === 'string') {
                        const absoluteUrl =  urljoin(baseUrl, params[0])
                        return target[propertyName](absoluteUrl, ...params.slice(1))
                    }
                    return target[propertyName](...params)
                }
            },
        })
    )
}

export const API_BASE_URL = window.API_BASE_URL || window.location.href
export const request = superagentAbsolute(superagent)(API_BASE_URL)
export function fetchOnce() {
    let req

    const fetch = function (url) {
        if (req) req.abort()
        req = request.get(url)
        return req
    }

    fetch.abort = function() {
        if (req) req.abort()
    }

    return fetch
}

let configCache
export function getConfig() {
    if(configCache) {
        return Promise.resolve(configCache)
    } else {
        return request.get('/api/config').then((res) => {
            configCache = res.body
            return configCache
        })
    }
}

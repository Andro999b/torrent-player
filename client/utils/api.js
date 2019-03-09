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
                };
            },
        })
    )
}

export const API_BASE_URL = window.API_BASE_URL || window.location.href
export const request = superagentAbsolute(superagent)(API_BASE_URL)
export function fetchOnce() {
    let req

    return function (url) {
        if (req) req.abort()
        req = request.get(url)
        return req
    }
}

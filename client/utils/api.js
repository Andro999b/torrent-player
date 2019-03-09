import superagent from 'superagent'
import superagentAbsolute from 'superagent-absolute'

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

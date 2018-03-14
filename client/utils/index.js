import request from 'superagent'

export function fetchOnce() {
    let req

    return function(url) {
        if (req) req.abort()
        req = request.get(url)
        return req
    }
}

const playableExtensions = ['avi', 'mkv', 'mp4', 'webm']

export function isPlayable(fileName) {
    return playableExtensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}
import request from 'superagent'
import playableExtensions from '../../resources/video-extensions.json'

export function fetchOnce() {
    let req

    return function (url) {
        if (req) req.abort()
        req = request.get(url)
        return req
    }
}

export function isPlayable(fileName) {
    return playableExtensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}

export function getTorrentFileContentLink(hashInfo, fileIndex) {
    return '/api/torrents/' + hashInfo + '/files/' + fileIndex
}

export function getTorrentHLSLink(hashInfo, fileIndex) {
    return '/api/torrents/' + hashInfo + '/files/' + fileIndex + '/hls'
}

export function getTorrentHLSKeepAliveLink(hashInfo, fileIndex) {
    return '/api/torrents/' + hashInfo + '/files/' + fileIndex + '/hls/keepAlive'
}

export function invokeAll() {
    const invockes = Array.from(arguments)
    return function () {
        invockes.forEach((invoke) => {
            invoke.call()
        })
    }
}

export function isTablet() {
    if(window.matchMedia) { 
        const isMobile = window.matchMedia('only screen and (max-width: 768px)')
        return isMobile.matches
    }

    return false
}

export function isMobile() {
    if(window.matchMedia) { 
        const isMobile = window.matchMedia('only screen and (max-width: 570px)')
        return isMobile.matches
    }

    return false
}

export function diff(oldObject, newObject) {
    const result = {}
    Object.keys(newObject).forEach((key) => {
        if(newObject[key] != oldObject[key])
            result[key] = newObject[key]
    })
    return result
}
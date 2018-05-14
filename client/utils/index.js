import request from 'superagent'

export function fetchOnce() {
    let req

    return function (url) {
        if (req) req.abort()
        req = request.get(url)
        return req
    }
}

const playableExtensions = ['ogv', 'mp4', 'webm', 'avi']

export function isPlayable(fileName) {
    return playableExtensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}

export function getTorrentFileContentLink(hashInfo, fileIndex) {
    return '/api/torrents/' + hashInfo + '/files/' + fileIndex
}

export function getTorrentFileTranscodeLink(hashInfo, fileIndex) {
    return '/api/torrents/' + hashInfo + '/files/' + fileIndex + '/transcode'
}

export function invokeAll() {
    const invockes = Array.from(arguments)
    return function () {
        invockes.forEach((invoke) => invoke.call())
    }
}
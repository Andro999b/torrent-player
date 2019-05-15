import playableExtensions from '../../resources/video-extensions.json'

export function isPlayable(fileName) {
    return playableExtensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}

export function getTorrentFileContentLink(hashInfo, fileIndex) {
    return `/api/torrents/${hashInfo}/files/${fileIndex}`
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

export function isMobileApp() {
    return window.mobileApp != null
}

export function diff(oldObject, newObject) {
    const result = {}
    Object.keys(newObject).forEach((key) => {
        if(newObject[key] != oldObject[key])
            result[key] = newObject[key]
    })
    return result
}

export function toHHMMSS(timestamp) {
    var hours   = Math.floor(timestamp / 3600)
    var minutes = Math.floor((timestamp - (hours * 3600)) / 60)
    var seconds = Math.floor(timestamp - (hours * 3600) - (minutes * 60))

    if (hours   < 10) {
        hours   = '0' + hours
    }
    if (minutes < 10) {
        minutes = '0' + minutes
    }
    if (seconds < 10) {
        seconds = '0' + seconds
    }
    return hours+':'+minutes+':'+seconds
}

export function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true
    }

    return false
}

export function hasArgv(arg) {
    if(window.process && window.process.argv) {
        return window.process.argv.indexOf(`--${arg}`) != -1
    }

    return false
}
const fs = require('fs-extra')
const path = require('path')
const readline = require('readline')
const Stream = require('stream')
const sprintf = require('sprintf-js').sprintf
const ResponseError = require('./ResponseError')
const { RESOURCES_DIR } = require('../config')

const videExtensions = JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, 'video-extensions.json')))
const audioExtensions = JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, 'audio-extensions.json')))
const psMediaExtensions = JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, 'ps-media-extensions.json')))

function hasOneOfExtensions(extensions, fileName) {
    return extensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}

function parseCodeDuration(codecDuration) {
    const timeParts = codecDuration.split(':')
    return parseInt(timeParts[0]) * 3600 + 
            parseInt(timeParts[1]) * 60 + 
            parseFloat(timeParts[2])
}

function formatDLNADuration(duration) {
    let seconds, hours, minutes

    if (duration < 0) {
        seconds = 0.0
        hours = 0
        minutes = 0
    } else {
        seconds = duration % 60
        hours = Math.floor(duration / 3600)
        minutes = Math.floor(duration / 60) % 60
    }

    if (hours > 99999) {
        // As per DLNA standard
        hours = 99999
    }

    return sprintf('%01d:%02d:%06.3f', hours, minutes, seconds)
}

function getLastFileLine(fileName) {
    return fs.exists(fileName).then((exists) => {
        if (!exists) return null

        let inStream = fs.createReadStream(fileName)
        let outStream = new Stream
        return new Promise((resolve, reject) => {
            let rl = readline.createInterface(inStream, outStream)

            let lastLine
            rl.on('line', (line) => lastLine = line)
                .once('error', reject)
                .once('close', () => resolve(lastLine))
        })
    })
}

function parseRange(str) {
    if (typeof str !== 'string') {
        throw new TypeError('argument str must be a string')
    }

    const index = str.indexOf('=')

    if (index === -1) {
        throw new ResponseError('Malformed range', 400)
    }

    // split the range string
    const arr = str.slice(index + 1).split(',')
    const ranges = []

    // add ranges type
    ranges.type = str.slice(0, index)

    // parse all ranges
    for (let i = 0; i < arr.length; i++) {
        const part = arr[i].split('-')
        const start = parseInt(part[0], 10)
        const end = parseInt(part[1], 10)

        if (isNaN(start) && isNaN(start)) continue

        const range = {}
        if (!isNaN(start)) range.start = start
        if (!isNaN(end)) range.end = end

        // add range
        ranges.push(range)
    }

    if (ranges.length < 1) {
        throw new ResponseError('Unsatisfiable ranges', 416)
    }

    return ranges
}

function waitForFile(path, timeout) {
    const CHECK_INTERVAL = 1000
    return new Promise((resolve, reject) => {
        let lastCheckTs = new Date().getTime()
        const checkFile = () => {
            timeout -= (new Date().getTime() - lastCheckTs)
            if (timeout < 0) {
                reject()
                return
            }
            
            fs.exists(path)
                .then((exits) => {
                    if (exits) {
                        resolve()
                    } else {
                        setTimeout(checkFile, CHECK_INTERVAL)
                    }
                })
                .catch(reject)
        }
        checkFile()
    })
}

function touch(path) {
    fs.open(path, 'w').then(fs.close)
}

function fileDirectory(path) {
    const lastSeparator = path.lastIndexOf('/')
    return lastSeparator > -1 ? path.substring(0, lastSeparator) : ''
}

module.exports = {
    isVideo(fileName) {
        return hasOneOfExtensions(videExtensions, fileName)
    },
    isAudio(fileName) {
        return hasOneOfExtensions(audioExtensions, fileName)
    },
    isPsSupported(fileName) {
        return hasOneOfExtensions(psMediaExtensions, fileName)
    },
    parseRange,
    formatDLNADuration,
    parseCodeDuration,
    getLastFileLine,
    waitForFile,
    touch,
    fileDirectory
}
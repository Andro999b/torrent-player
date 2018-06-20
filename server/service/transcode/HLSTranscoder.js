const path = require('path')
const promisify = require('util').promisify
const rmrf = promisify(require('rimraf'))
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
//const metadataService = require('../metadata')
//const getEncodingSettings = require('../encoderSettings')

const { 
    HLS_DIRECTORY, 
    HLS_TRANSCODER_IDLE_TIMEOUT, 
    HLS_FRAGMENT_DURATION,
    TORRENTS_DIR 
} = require('../../config')
const debug = require('debug')('transcode-hls')

class HLSTranscoder {
    constructor(torrent, fileIndex) {
        this.file = torrent.files[fileIndex]

        this.torrentHash = torrent.infoHash
        this.fileIndex = fileIndex
        this.hlsBaseUrl = `/api/torrents/${torrent.infoHash}/files/${fileIndex}/hls/`

        this.outputDirectory = path.join(HLS_DIRECTORY, torrent.infoHash, this.fileIndex)
        this.m3uPath = path.join(this.outputDirectory, 'list.m3u8')

        this._needToStartTranscoding = true
    }

    transcode(force = false) {
        if (force) {
            return this.spawn()
        }

        if (!this._needToStartTranscoding) {
            return Promise.resolve(this)
        }

        return fs.exists(this.hlsBaseUrl + 'finished')
            .then((isExits) => {
                if(isExits) {
                    this._needToStartTranscoding = false
                    return Promise.resolve(this)
                }

                return this.spawn()
            })
    }

    spawn() {
        const { file, m3uPath, hlsBaseUrl, outputDirectory } = this

        return this.kill() 
            .then(() => fs.ensureDir(outputDirectory))
            .then(() => {
                return new Promise((resolve, reject) => {
                    debug(`Start transcoding ${this.torrentHash} ${file.path}`)

                    this.command = ffmpeg(file.progress >= 1 ? path.join(TORRENTS_DIR, file.path) : file.createReadStream())
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .addOutputOption('-preset ultrafast')
                        .addOutputOption('-tune zerolatency')
                        .addOutputOption(`-hls_time ${HLS_FRAGMENT_DURATION}`)
                        .addOutputOption('-hls_list_size 0')
                        .addOutputOption('-hls_allow_cache 1')
                        .addOutputOption('-hls_segment_filename 1')
                        .addOutputOption(`-hls_base_url ${hlsBaseUrl}`)
                        .addOutputOption(`-hls_segment_filename ${outputDirectory}/segment_%03d.ts`)
                        .fps(25)
                        .format('hls')
                        .once('error', (err) => {
                            this.command = null
                            console.error('Cannot process video: ' + err.message) // eslint-disable-line
                            reject(err)
                        })
                        .once('start', () => {
                            this.resetIdle()                            
                            this._isRunning = true
                            this._needToStartTranscoding = false

                            setTimeout(() => resolve(), 1000) //wait until m3u8 created
                        })
                        .once('end', function() {
                            fs.writeFile(this.hlsBaseUrl + 'finished')
                            debug(`Finish transcoding ${this.torrentHash} ${file.path}`)
                        })
                        .save(m3uPath)
                })
            })
            .then(() => this)
    }

    readM3U8() {
        return fs.readFile(this.m3uPath)
    }

    getSegment(name) {
        this.continue()
        this.resetIdle()

        return fs.createReadStream(path.join(this.outputDirectory, name))
    }

    resetIdle() {
        if(!this.idleTimeoutId) 
            clearTimeout(this.idleTimeoutId)

        this.idleTimeoutId = setTimeout(
            () => {
                this.stop(),
                this.idleTimeoutId = null
            }, 
            HLS_TRANSCODER_IDLE_TIMEOUT
        )
    }

    stop() {
        if (this.command && this._isRunning) {
            this._isRunning = false
            try {
                this.command.kill('SIGSTOP')
            } catch (e) {
                this.command.renice(-5)
            }
        }
    }

    continue() {
        if (this.command && !this._isRunning) {
            this._isRunning = true
            try {
                this.command.kill('SIGCONT')
            } catch (e) {
                this.command.renice(0)
            }
        }
    }

    kill() {
        if (this.command) {
            this.command.kill()
        }
        return cleanUpHlsData(this.torrentHash, this.fileIndex)
    }
}

function cleanUpHlsData(torrentHash, fileIndex) {
    let targetDir = path.join(HLS_DIRECTORY, torrentHash)

    if (fileIndex != undefined)
        targetDir = path.join(targetDir, fileIndex)

    return rmrf(targetDir)
}

module.exports = { HLSTranscoder, cleanUpHlsData }
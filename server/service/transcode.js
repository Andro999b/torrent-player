const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const metadataService = require('./metadata')
const CycleBuffer = require('../utils/CycleBuffer')
const { TORRENTS_DIR } = require('../config')
const getEncodingSettings = require('./encoderSettings')
const debug = console.log//require('debug')('transcode')

class Transcoder {
    constructor() {
        this.lastStart = 0
        this._isRunning = false
    }

    spawn(torrent, file, start) {
        if (!this.command
            || this.torrentHash != torrent.infoHash
            || this.filePath != file.path
            || this.lastStart != start) {
            if (this.command) {
                this.kill()
            }

            this.torrentHash = torrent.infoHash
            this.filePath = file.path
            this.lastStart = start
            this.transcoderInput = file.progress == 1 ? path.join(TORRENTS_DIR, this.filePath) : file.createReadStream()

            return metadataService
                .getMetdadata(file)
                .then((metadata) => {
                    return new Promise((resolve, reject) => {
                        debug(`Start transcoding ${this.torrentHash} ${this.filePath}, tile pos ${start}`)
                        const { videoBitrate, audioBitrate, videoSize } = getEncodingSettings(metadata)
                        

                        this.metadata = metadata
                        this._isRunning = true
                       
                        const buffer = new CycleBuffer({ capacity: 1024 * 20 })
                        buffer.on('continueWritting', () => this.continue())
                        buffer.on('stopWritting', () => this.stop())
                        buffer.on('full', () => this.kill())

                        this.buffer = buffer

                        this.command = ffmpeg(this.transcoderInput)
                            .seekInput(start)
                            .videoCodec('libx264')
                            .videoBitrate(videoBitrate * 1024)
                            .size(videoSize)
                            .autopad()
                            .audioCodec('aac')
                            .audioBitrate(audioBitrate * 1024)
                            .audioChannels(2)
                            .addOption('-preset ultrafast')
                            .addOption('-level 31')
                            .addOption('-crf 22')
                            .addOption('-tune zerolatency')
                            .addOutputOption('-copyts')
                            .fps(25)
                            .format('mpegts')
                            .on('error', (err) => {
                                this.command = null
                                console.error('Cannot process video: ' + err.message) // eslint-disable-line
                                reject(err)
                            })
                            // .on('progress', (progress) => {
                            //     if (progress.currentFps < 50 && progress.currentFps > 0) {
                            //         debug('low perfomance', progress)
                            //     }
                            // })
                            .on('start', resolve)

                        this.transcoderStream = this.command.stream()
                            .on('data', (chunk) => buffer.write(chunk))
                            .on('error', () => buffer.final())
                            .on('end', () => buffer.final())
                    })
                })
        }

        return Promise.resolve()
    }

    stop() {
        if (this.command && this._isRunning) {
            this._isRunning = false
            try {
                this.command.kill('SIGSTOP')
            } catch (e) {
                console.error(e)
                this.transcoderStream.pause()
                this.command.renice(-5)
                // this.kill() //fallback for windows
            }
        }
    }

    continue() {
        if (this.command && !this._isRunning) {
            this._isRunning = true
            try {
                this.command.kill('SIGCONT')
            } catch (e) {
                console.error(e)
                this.transcoderStream.resume()
                this.command.renice(0)
            }
        }
    }

    transcode(torrent, file, startByte = 0) {
        return this.spawn(torrent, file, startByte).then(() => {
            const { buffer, metadata } = this
            return { buffer, metadata }
        })
    }

    kill() {
        if (this.command) {
            debug(`Stop transcoding ${this.torrentHash} ${this.filePath}`)
            this.command.kill()
            this.command = null
            this.buffer = null
            this.transcoderStream = null
            this._isRunning = false
        }
    }
}


const transcoders = {}

module.exports = {
    stopTranscoding(torrent) {
        Object.keys(transcoders).forEach((key) => {
            const transcoder = transcoders[key]
            if (transcoder.torrentHash == torrent.infoHash) {
                transcoder.kill()
            }
        })
    },
    getTranscoder(clientId) {
        let transcoder = transcoders[clientId]
        if (!transcoder) {
            transcoder = new Transcoder()
            transcoders[clientId] = transcoder
            return transcoder
        }

        return transcoder
    }
}

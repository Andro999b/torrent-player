const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const metadataService = require('../metadata')
const CycleBuffer = require('../../utils/CycleBuffer')
const { TORRENTS_DIR, TRANSCODER_IDLE_TIMEOUT } = require('../../config')
const debug = console.error //require('debug')('transcode')

class Transcoder {
    constructor() {
        this._lastStart = 0
        this._isRunning = false
    }

    spawn(torrent, file, start, duration) {
        if (!this.command
            || this.torrentHash != torrent.infoHash
            || this.filePath != file.path
            || this._lastStart != start) {
            if (this.command) {
                this.kill()
            }
            
            this.torrentHash = torrent.infoHash
            this.filePath = file.path
            this._lastStart = start

            return metadataService
                .getMetdadata(file)
                .then((metadata) => {
                    return new Promise((resolve, reject) => {
                        if(this.command) resolve() //fix concurrect problem

                        debug(`Start transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)

                        this.metadata = metadata
                        this._isRunning = true

                        const buffer = new CycleBuffer({ capacity: 1024 * 20 })
                        buffer.on('continueWritting', () => this.continue())
                        buffer.on('stopWritting', () => this.stop())
                        buffer.on('full', () => this.kill())

                        this.buffer = buffer
                        this.command = ffmpeg(file.progress >= 1 ? path.join(TORRENTS_DIR, this.filePath) : file.createReadStream())
                            .seekInput(start)
                            .videoCodec('libx264')
                            .audioCodec('aac')
                            .addOption('-preset ultrafast')
                            .addOption('-tune zerolatency')
                            .addOutputOption('-copyts')
                            .fps(25)
                            .format('mpegts')
                            .once('error', (err) => {
                                console.error('Cannot process video: ' + err.message) // eslint-disable-line
                                reject(err)
                            })
                            .once('start', resolve)

                        if (duration)
                            this.command.duration(duration)

                        this.transcoderStream = this.command.stream()
                            .on('data', (chunk) => buffer.write(chunk))
                            .once('error', () => buffer.final())
                            .once('end', () => {
                                debug(`Finish transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)
                                debug(`Bytes writed to buffer ${buffer.bytesWrited}`)
                                buffer.final()
                            })
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

    transcode(torrent, file, start = 0, duration = 0) {
        if(!this.idleTimeoutId) clearImmediate(this.idleTimeoutId)

        return this.spawn(torrent, file, start, duration).then(() => {
            const { buffer, metadata } = this
            return { buffer, metadata }
        })
    }

    notifyIdle() {
        if(!this.idleTimeoutId) {
            this.idleTimeoutId = setTimeout(
                () => {
                    this.kill(),
                    this.idleTimeoutId = null
                }, 
                TRANSCODER_IDLE_TIMEOUT
            )
        }
    }

    kill() {
        if (this.command) {
            debug(`Stop transcoding ${this.torrentHash} ${this.filePath}`)
            this.command.kill()
            this.command = null
            this.buffer = null
            this.transcoderStream = null
            this._isRunning = false
            if(!this.idleTimeoutId) clearImmediate(this.idleTimeoutId)
        }
    }
}

module.exports = Transcoder

const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const CycleBuffer = require('../../utils/CycleBuffer')
const { TORRENTS_DATA_DIR } = require('../../config')
const debug = require('debug')('transcode')
const checkIfTorrentFileReady = require('../torrents/checkIfTorrentFileReady')
const database = require('../torrents/database')
const { parseCodeDuration } = require('../../utils')

class Transcoder {
    constructor() {
        this._lastStart = 0
        this._isRunning = false
    }

    async spawn(torrent, file, start, duration) {
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

            await new Promise((resolve, reject) => {
                if (this.command) {//fix concurrect problem
                    return resolve()
                }

                debug(`Start transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)

                this._isRunning = true

                const buffer = new CycleBuffer({ capacity: 1024 * 20 })
                buffer.on('continueWritting', () => this.continue())
                buffer.on('stopWritting', () => this.stop())
                buffer.on('full', () => this.kill())

                this.buffer = buffer

                const source = checkIfTorrentFileReady(file) ?
                    path.join(TORRENTS_DATA_DIR, file.path) :
                    file.createReadStream()

                this.command = ffmpeg(source)
                    .seekInput(start)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .addOutputOption('-max_muxing_queue_size 400')
                    .addOutputOption('-preset ultrafast')
                    .addOutputOption('-tune zerolatency')
                    .addOutputOption('-crf 22')
                    .addOutputOption('-copyts')
                    .fps(25)
                    .format('mpegts')
                    .once('error', (err, stdout, stderr) => {
                        if (err.message.search('SIGKILL') == -1) { //filter SIGKILL
                            console.error('Cannot process video: ' + err.message, stderr) // eslint-disable-line
                        }
                        reject(err)
                    })
                    .once('codecData', (metadata) => {
                        this.metadata = { ...metadata, duration: parseCodeDuration(metadata.duration)}
                        database.storeTorrentFileMetadata(
                            this.torrentHash, 
                            this.filePath, 
                            this.metadata
                        )
                        resolve()
                    })
                    .once('start', (commandLine) => {
                        debug(`FFMpeg command: ${commandLine}`)
                    })

                if (duration)
                    this.command.duration(duration)

                this.transcoderStream = this.command.stream()
                    .on('data', (chunk) => buffer.write(chunk))
                    .once('error', (error) => {
                        console.error(`Transcoding stream closed with error: ${error.message}`)
                        buffer.final()
                    })
                    .once('end', () => {
                        debug(`Finish transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)
                        debug(`Bytes writed to buffer ${buffer.bytesWrited}`)
                        buffer.final()
                    })
            })
        }
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

    async transcode(torrent, file, start = 0, duration = 0) {
        await this.spawn(torrent, file, start, duration)

        const { buffer, metadata } = this
        return { buffer, metadata }
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

module.exports = Transcoder

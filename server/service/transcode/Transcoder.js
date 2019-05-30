const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const CycleBuffer = require('../../utils/CycleBuffer')
const BufferedStream = require('bufferedstream')
const { TORRENTS_DATA_DIR } = require('../../config')
const checkIfTorrentFileReady = require('../torrents/checkIfTorrentFileReady')
const { parseCodeDuration } = require('../../utils')

const debug = require('debug')('transcode')

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

            this.kill()

            this.torrentHash = torrent.infoHash
            this.filePath = file.path
            this._lastStart = start

            return new Promise((resolve, reject) => {
                if (this.command) {//fix concurrect problem
                    resolve(this.commandContext)
                    return
                }

                const startFFmpeg = (source) => {
                    const commandContext = this.commandContext = {}

                    debug(`Start transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)

                    this._isRunning = true

                    const buffer = new CycleBuffer({ capacity: 1024 * 20 })
                    buffer.on('continueWritting', () => this.continue())
                    buffer.on('stopWritting', () => this.stop())
                    buffer.on('full', () => this.kill())

                    commandContext.stream = buffer.readStream()

                    this.command = ffmpeg(source)
                        .videoCodec('mpeg2video')
                        .audioCodec('aac')
                        .addOutputOption('-max_muxing_queue_size 1024')
                        .addOutputOption('-preset ultrafast')
                        .addOutputOption('-tune zerolatency')
                        .addOutputOption('-crf 22')
                        .addOutputOption('-copyts')
                        .format('mpegts')
                        .once('error', (err, stdout, stderr) => {
                            if (err.message.search('SIGKILL') == -1) { //filter SIGKILL
                                console.error('Cannot process video: ' + err.message, stderr) // eslint-disable-line
                            }
                            reject(err)
                            this.kill()
                        })
                        .once('codecData', (metadata) => {
                            commandContext.metadata = { ...metadata, duration: parseCodeDuration(metadata.duration)}
                            resolve(commandContext)
                        })
                        .once('start', (commandLine) => {
                            console.log(`FFMpeg command: ${commandLine}`)
                        })

                    if (duration)
                        this.command.duration(duration)

                    if (start)
                        this.command.seekInput(start)

                    commandContext.transcoderStream = this.command.stream()
                        .on('data', (chunk) =>
                            buffer.write(chunk)
                        )
                        .once('error', (error) => {
                            console.error(`Transcoding stream closed with error: ${error.message}`)
                            buffer.final()
                            this.kill()
                        })
                        .once('end', () => {
                            debug(`Finish transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)
                            debug(`Bytes writed to buffer ${buffer.bytesWrited}`)
                            buffer.final()
                            this.kill()
                        })
                }

                if(checkIfTorrentFileReady(file)) {
                    startFFmpeg(path.join(TORRENTS_DATA_DIR, file.path))
                } else {
                    startFFmpeg(new BufferedStream(1024 * 1024, file.createReadStream()))
                }
            })
        } else {
            return this.commandContext
        }
    }

    stop() {
        if (this.command && this._isRunning) {
            this._isRunning = false
            try {
                this.command.kill('SIGSTOP')
            } catch (e) {
                console.error(e)
                this.commandContext.transcoderStream.pause()
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
                this.commandContext.transcoderStream.resume()
                this.command.renice(0)
            }
        }
    }

    async transcode(torrent, file, start = 0, duration = 0) {
        const { stream, metadata } = await this.spawn(torrent, file, start, duration)
        return { stream, metadata }
    }

    cleanup() {
        this.command = null
        this.commandContext = null
        this._isRunning = false
    }

    kill() {
        if (this.command) {
            debug(`Stop transcoding ${this.torrentHash} ${this.filePath}`)
            this.command.kill()
            this.cleanup()
        }
    }
}

module.exports = Transcoder

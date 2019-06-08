const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const CycleBuffer = require('../../utils/CycleBuffer')
const { TORRENTS_DATA_DIR } = require('../../config')
const checkIfTorrentFileReady = require('../torrents/checkIfTorrentFileReady')
const torrentsDatabase = require('../torrents/database')
const tanscoderSettings = require('./settings')
const { parseCodeDuration } = require('../../utils')

const debug = require('debug')('transcode')

class CommandContext {
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

    cleanup() {
        this.command = null
        this.stream = null
        this.transcoderStream = null
        this.metadata = null
        this._isRunning = false
    }

    kill() {
        if (this.command) {
            this.command.kill()
            this.cleanup()
        }
    }
}

class Transcoder {
    constructor(clientId) {
        this._lastStart = 0
        this._isRunning = false
        this.clientId = clientId
    }

    async spawn(torrent, file, start, duration) {
        if (
            this.torrentHash != torrent.infoHash
            || this.filePath != file.path
            || this._lastStart != start) {

            this.kill()
            this.torrentHash = torrent.infoHash
            this.filePath = file.path
            this._lastStart = start

            return new Promise((resolve, reject) => {
                if (this.commandContext) {//fix concurrect problem
                    resolve(this.commandContext)
                    return
                }

                const startFFmpeg = (source) => {
                    const commandContext = this.commandContext = new CommandContext()

                    debug(`Start transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)

                    commandContext._isRunning = true

                    const buffer = new CycleBuffer({ capacity: 1024 })
                    buffer.on('continueWritting', () => commandContext.continue())
                    buffer.on('stopWritting', () => commandContext.stop())
                    buffer.on('full', () => commandContext.kill())

                    commandContext.stream = buffer.readStream()

                    const { setFFMpegSettings } = tanscoderSettings(this.clientId)

                    commandContext.command = setFFMpegSettings(ffmpeg(source))
                        .format('mpegts')
                        .addOutputOption('-copyts')
                        .once('error', (err, stdout, stderr) => {
                            if (err.message.search('SIGKILL') == -1) { //filter SIGKILL
                                console.error('Cannot process video: ' + err.message, stderr) // eslint-disable-line
                            }
                            reject(err)
                            commandContext.kill()
                        })
                        .once('codecData', (metadata) => {
                            commandContext.metadata = { ...metadata, duration: parseCodeDuration(metadata.duration)}
                            torrentsDatabase.setTorrentFileDuration(this.torrentHash, this.filePath, metadata.duration)
                            resolve(commandContext)
                        })
                        .once('start', (commandLine) => {
                            console.log(`FFMpeg command: ${commandLine}`) // eslint-disable-line no-console
                        })

                    if (duration)
                        commandContext.command.duration(duration)

                    if (start)
                        commandContext.command.seekInput(start)

                    commandContext.transcoderStream = commandContext.command.stream()
                        .on('data', (chunk) =>
                            buffer.write(chunk)
                        )
                        .once('error', (error) => {
                            console.error(`Transcoding stream closed with error: ${error.message}`)
                            buffer.final()
                            commandContext.kill()
                        })
                        .once('end', () => {
                            debug(`Finish transcoding ${this.torrentHash} ${this.filePath}, tile start from ${start}, duration ${duration}`)
                            debug(`Bytes writed to buffer ${buffer.bytesWrited}`)
                            buffer.final()
                            commandContext.kill()
                        })
                }

                if(checkIfTorrentFileReady(file)) {
                    startFFmpeg(path.join(TORRENTS_DATA_DIR, file.path))
                } else {
                    startFFmpeg(file.createReadStream())
                }
            })
        } else {
            return this.commandContext
        }
    }

    async transcode(torrent, file, start = 0, duration = 0) {
        const { stream, metadata } = await this.spawn(torrent, file, start, duration)
        return { stream, metadata }
    }

    cleanup() {
        this.commandContext = null
    }

    kill() {
        if (this.commandContext) {
            this.commandContext.kill()
        }
        this.cleanup()
    }
}

module.exports = Transcoder

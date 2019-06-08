const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const CycleBuffer = require('../../utils/CycleBuffer')
const { TORRENTS_DATA_DIR } = require('../../config')
const checkIfTorrentFileReady = require('../torrents/checkIfTorrentFileReady')
const torrentsDatabase = require('../torrents/database')
const tanscoderSettings = require('./settings')
const { parseCodeDuration } = require('../../utils')

const debug = require('debug')('transcode')

class FileTranscoder {
    constructor(torrent, file, clientId) {
        this.torrent = torrent
        this.file = file
        this.clientId = clientId

        this.cleanup()
    }

    async transcode(start, duration) {
        if(start === this.lastStart) {
            return
        }
        this.lastStart = start
        
        this.killPreviousFFMpeg()

        this.buffer = new CycleBuffer({ capacity: 1024 })
        this.buffer.on('continueWritting', () => this.continue())
        this.buffer.on('stopWritting', () => this.stop())
        this.buffer.on('full', () => this.kill())
        this.stream = this.buffer.readStream()

        let source = checkIfTorrentFileReady(this.file) ?
            path.join(TORRENTS_DATA_DIR, this.file.path) :
            this.file.createReadStream()

        const { setFFMpegSettings } = tanscoderSettings(this.clientId)

        this.ffmpegCommand = setFFMpegSettings(ffmpeg(source))
            .format('mpegts')
            .addOutputOption('-copyts')

        return new Promise((resolve, reject) => {
            this.isRunning = true
            this.ffmpegCommand
                .once('error', (err, stdout, stderr) => {
                    if (err.message.search('SIGKILL') == -1) { //filter SIGKILL
                        console.error('Cannot process video: ' + err.message, stderr) // eslint-disable-line
                    }
                    reject(err)
                    this.cleanup()
                })
                .once('codecData', (metadata) => {
                    this.metadata = { ...metadata, duration: parseCodeDuration(metadata.duration)}
                    torrentsDatabase.setTorrentFileDuration(this.torrent.infoHash, this.file.path, metadata.duration)
                    resolve()
                })
                .once('start', (commandLine) => {
                    console.log(`FFMpeg command: ${commandLine}`) // eslint-disable-line no-console
                })

            if (duration)
                this.ffmpegCommand.duration(duration)

            if (start)
                this.ffmpegCommand.seekInput(start)

            this.ffmpegStream = this.ffmpegCommand.stream()
                .on('data', (chunk) =>
                    this.buffer.write(chunk)
                )
                .once('error', (error) => {
                    console.error(`Transcoding stream closed with error: ${error.message}`)
                    this.buffer.final()
                    this.kill()
                })
                .once('end', () => {
                    debug(`Finish transcoding ${this.torrent.infoHash} ${this.file.path}, tile start from ${start}`)
                    debug(`Bytes writed to buffer ${this.buffer.bytesWrited}`)
                    this.buffer.final()
                    this.cleanup()
                })
        })
    }

    continue() {
        if (this.command && !this.isRunning) {
            this.isRunning = true
            try {
                this.ffmpegCommand.kill('SIGCONT')
            } catch (e) {
                console.error(e)
                this.ffmpegStream.resume()
                this.ffmpegCommand.renice(0)
            }
        }
    }

    stop () {
        if (this.ffmpegCommand && this.isRunning) {
            this.isRunning = false
            try {
                this.ffmpegCommand.kill('SIGSTOP')
            } catch (e) {
                console.error(e)
                this.ffmpegStream.pause()
                this.ffmpegCommand.renice(-5)
            }
        }
    }

    killPreviousFFMpeg() {
        if(this.ffmpegCommand) {
            this.ffmpegCommand.removeAllListeners('error')
            this.ffmpegCommand.removeAllListeners('codecData')
            this.ffmpegCommand.removeAllListeners('start')
            this.ffmpegCommand.kill()
        }

        if(this.ffmpegStream) {
            this.ffmpegStream.removeAllListeners('data')
            this.ffmpegStream.removeAllListeners('end')
            this.ffmpegStream.removeAllListeners('error')
        }

        if(this.buffer) {
            this.buffer.removeAllListeners('continueWritting')
            this.buffer.removeAllListeners('stopWritting')
            this.buffer.removeAllListeners('full')
        }
    }

    kill() {
        this.killPreviousFFMpeg()
        this.cleanup()
    }

    cleanup() {
        this.lastStart = null
        this.ffmpegCommand = null
        this.ffmpegStream = null
        this.stream = null
        this.metadata = null
    }
}

class Transcoder {
    constructor(clientId) {
        this.clientId = clientId
        this.fileTranscoders = {}
    }

    async transcode(torrent, file, start = 0, duration = 0) {
        const key = this.getFileTrnascoderKey(torrent, file)

        let fileTranscoder = this.fileTranscoders[key]
        if(!fileTranscoder) {
            fileTranscoder = new FileTranscoder(torrent, file, this.clientId)
            this.fileTranscoders[key] = fileTranscoder
        }

        Object.keys(this.fileTranscoders).forEach((fileKey) => {
            if(key != fileKey)
                this.fileTranscoders[fileKey].kill()
        })

        await fileTranscoder.transcode(start, duration)

        return {
            stream: fileTranscoder.stream,
            metadata: fileTranscoder.metadata
        }
    }

    getFileTrnascoderKey(torrent, file) {
        return `${torrent.infoHash}${file.path}`
    }

    kill() {
        Object.keys(this.fileTranscoders).forEach((fileKey) => 
            this.fileTranscoders[fileKey].kill()
        )
    }
}

module.exports = Transcoder

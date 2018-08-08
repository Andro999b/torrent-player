const path = require('path')
const promisify = require('util').promisify
const rmrf = promisify(require('rimraf'))
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const m3u8 = require('m3u8-parser')
const { touch } = require('../../utils')

const {
    HLS_DIRECTORY,
    HLS_TRANSCODER_IDLE_TIMEOUT,
    HLS_FRAGMENT_DURATION,
    TORRENTS_DATA_DIR
} = require('../../config')
const { waitForFile } = require('../../utils')
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

    async transcode(force = false) {
        if (force) {
            return this.spawn()
        }

        if (!this._needToStartTranscoding) {
            return this
        }

        const isExits = await fs.exists(path.join(this.outputDirectory, 'finished'))

        if (isExits) {
            this._needToStartTranscoding = false
            return this
        }

        const progress = await this.loadProgress()

        return this.spawn(progress)
    }

    async spawn({ start_time }) {
        const { file, m3uPath, hlsBaseUrl, outputDirectory } = this
        this._needToStartTranscoding = false

        await fs.ensureDir(outputDirectory)
        await new Promise((resolve, reject) => {
            debug(`Start transcoding ${this.torrentHash} ${file.path}`)

            //file.progress nevere return correct value :/
            this.command = ffmpeg(file.progress >= 0.95 ? path.join(TORRENTS_DATA_DIR, file.path) : file.createReadStream())
                .videoCodec('libx264')
                .audioCodec('aac')
                .seekInput(start_time)
                .addOutputOption('-g 25')
                .addOutputOption('-max_muxing_queue_size 400')
                .addOutputOption('-preset ultrafast')
                .addOutputOption('-tune zerolatency')
                .addOutputOption('-crf 22')
                .addOutputOption(`-hls_time ${HLS_FRAGMENT_DURATION}`)
                .addOutputOption('-hls_list_size 0')
                .addOutputOption('-hls_flags append_list+temp_file')
                .addOutputOption('-hls_allow_cache 1')
                .addOutputOption('-hls_segment_filename 1')
                .addOutputOption(`-hls_base_url ${hlsBaseUrl}`)
                .addOutputOption(`-hls_segment_filename ${outputDirectory}/segment_%03d.ts`)
                .fps(25)
                .format('hls')
                .once('error', (err, stdout, stderr) => {
                    this._needToStartTranscoding = true
                    this.command = null
                    console.error('Cannot process video: ' + err.message, stderr) // eslint-disable-line
                    reject(err)
                })
                .once('start', () => {
                    this.resetIdle()
                    this._isRunning = true

                    waitForFile(this.m3uPath, 60 * 1000)
                        .then(resolve)
                        .catch(() => {
                            debug(`Hls file ${this.m3uPath} hasnt bean created during 1 minuet`)
                        })
                })
                .once('end', () => {
                    touch(path.join(this.outputDirectory, 'finished'))
                    debug(`Finish transcoding ${this.torrentHash} ${file.path}`)
                })
                .save(m3uPath)
        })

        return this
    }

    readM3U8() {
        return fs.readFile(this.m3uPath)
    }

    getSegment(name) {
        this.keepAlive()
        return fs.createReadStream(path.join(this.outputDirectory, name))
    }

    keepAlive() {
        this.continue()
        this.resetIdle()
    }

    resetIdle() {
        if (this.idleTimeoutId)
            clearTimeout(this.idleTimeoutId)

        this.idleTimeoutId = setTimeout(
            () => {
                this.stop()
                this.idleTimeoutId = null
            },
            HLS_TRANSCODER_IDLE_TIMEOUT
        )
    }

    async loadProgress() {
        const exists = await fs.exists(this.m3uPath)

        if (exists) {
            const buf = await fs.readFile(this.m3uPath)
            const parser = new m3u8.Parser()

            parser.push(buf.toString('utf8'))
            parser.end()

            const { segments } = parser.manifest
            const start_time = segments.reduce(
                (acc, seg) => acc + seg.duration, 0
            )

            return { start_time }
        } else {
            return { start_time: 0 }
        }
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
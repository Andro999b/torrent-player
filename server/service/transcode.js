const path = require('path')
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const debug = require('debug')('transcode')
const { TRANSCODE_DIR } = require('../config')

const MIN_FRAMES = 1000 // 20 sec

const transcodeFiles = {}

class TranscodeFile {
    constructor() {
        this.isCompleted = false
        this.isStarted = false
        this.isPaused = false
        this.aciveStreams = 0
    }

    transcode(torrent, fileIndex, file) {
        this.path = path.join(TRANSCODE_DIR, torrent.infoHash, fileIndex + '.mp4')

        return new Promise((resolve, reject) => {
            let initalFramesReady = false
            fs.ensureDir(path.join(TRANSCODE_DIR, torrent.infoHash), () => {
                this.command = ffmpeg(file.createReadStream())
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .addOption('-preset ultrafast')
                    .addOption('-level 31')
                    .addOption('-crf 22')
                    .addOption('-tune zerolatency')
                    .fps(25)
                    .format('mpegts')
                    .save(this.path)
                    .on('error', (err) => {
                        debug('Cannot process video: ' + err.message)
                        reject(err)
                    })
                    .on('progress', (progress) => {
                        if (progress.currentFps < 50) {
                            debug('low perfomance', progress)
                        }
                        if (progress.frames > MIN_FRAMES && !initalFramesReady) {
                            initalFramesReady = true
                            this.isStarted = true
                            resolve(this)
                        }
                    })
                    .on('end', () => {
                        this.isCompleted = true
                    })
            })
        })
    }

    createReadStream() {
        if (this.path && this.isStarted) {
            //clear stop transcoding timeou
            clearTimeout(this.stopTimeout)
            this.stopTimeout = 0

            //resume transcoding
            this.aciveStreams++
            if(this.isPaused) {
                this.resume()
            }
            return fs.createReadStream(this.path)
        }
        return null
    }

    kill() {
        if(this.command) {
            this.command.kill()
        }
    }

    requestStop() {
        this.aciveStreams--
        if(this.aciveStreams < 0) this.aciveStreams = 0
        if(this.aciveStreams == 0 && !this.isPaused && !this.stopTimeout) {
            this.stopTimeout = setTimeout(() => { 
                this.stopTimeout = 0
                this.stop()
            }, 3000)
        }
    }

    stop() {
        if(this.command) {
            this.isPaused = true
            debug('stop transcoding', this.path)
            this.command.kill('SIGSTOP')
        }
    }

    resume() {
        if(this.command) {
            this.isPaused = false
            debug('resume transcoding', this.path)
            this.command.kill('SIGCONT')
        }
    }
}

module.exports = {
    stopTranscoding(torrent) {
        Object.keys(transcodeFiles).forEach((key) => {
            if(key.startsWith(torrent.infoHash)){
                transcodeFiles[key].kill()
            }
        })
    },
    getTranscodedFile(torrent, fileIndex) {
        const id = torrent.infoHash + ':' + fileIndex
        const file = torrent.files[fileIndex]

        let transcodeFile = transcodeFiles[id]
        if (!transcodeFile) {
            transcodeFile = new TranscodeFile()
            transcodeFiles[id] = transcodeFile

            return transcodeFile.transcode(torrent, fileIndex, file)
        }

        return Promise.resolve(transcodeFile)
    }
}

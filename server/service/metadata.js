const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const ffprobe = promisify(require('fluent-ffmpeg').ffprobe)

const { RESOURCES_DIR } = require('../config')
const browserVideoCodecs = JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, 'browser-video-codecs.json')))
const browserAudioCodecs = JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, 'browser-audio-codecs.json')))

const metadataCache = {}

module.exports = {
    async getMetadata(file) {
        if(metadataCache.hasOwnProperty(file.path))
            return metadataCache[file.path]

        const metadata = await ffprobe(file.createReadStream())

        metadataCache[file.path] = metadata

        return metadata
    },
    async getCodecs(file) {
        const { streams } = await this.getMetadata(file)

        const videoStream = streams.find((stream) => stream.codec_type == 'video')
        const audioStream = streams.find((stream) => stream.codec_type == 'audio')

        return {
            'video': videoStream && videoStream.codec_name,
            'audio': audioStream && audioStream.codec_name
        }
    },
    async isBrowserSupportedVideo(file) {
        return this.isFileSupportCodecs(file, browserVideoCodecs, browserAudioCodecs)
    },
    async isFileSupportCodecs(file, videoCodecs, audioCodecs) {
        const { streams } = await this.getMetadata(file)

        const isVideoSupported = streams.find((stream) => 
            videoCodecs.indexOf(stream.codec_name) != -1
        ) != null

        const isAudioSupported = streams.find((stream) => 
            audioCodecs.indexOf(stream.codec_name) != -1
        ) != null

        return isVideoSupported && isAudioSupported
    }
}
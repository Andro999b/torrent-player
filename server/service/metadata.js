const path = require('path')
const promisify = require('util').promisify
const ffprobe = promisify(require('fluent-ffmpeg').ffprobe)
const { TORRENTS_DATA_DIR } = require('../config')

const cache = {}

module.exports = {
    getMetdadata(file) {
        const fullPath = path.join(TORRENTS_DATA_DIR, file.path)
        if(cache.hasOwnProperty(fullPath)) {
            return Promise.resolve(cache[fullPath])
        }

        return ffprobe(file.createReadStream())
            .then((metadata) => {
                cache[fullPath] = metadata
                return metadata
            })
    },
    getVideoStream(metadata) {
        const vstreams = metadata.streams.filter((stream) => stream.codec_type == 'video')
        if(vstreams.length == 0)
            return null
        return vstreams[0]
    }
}
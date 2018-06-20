const path = require('path')
const promisify = require('util').promisify
const ffprobe = promisify(require('fluent-ffmpeg').ffprobe)
const { TORRENTS_DIR } = require('../config')
// const debug = require('debug')('metadata')

const cache = {}

module.exports = {
    getMetdadata(file) {
        if(cache.hasOwnProperty(file.path)) {
            return Promise.resolve(cache[file.path])
        }

        return ffprobe(path.join(TORRENTS_DIR, file.path))
            .then((metadata) => {
                cache[file.path] = metadata
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
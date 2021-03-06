const Transcoder = require('./Transcoder')
const { HLSTranscoder, cleanUpHlsData } = require('./HLSTranscoder')
const { TRANSCODING_ENABLED } = require('../../config')

const transcoders = {}
const hlsTanscoders = {}

module.exports = {
    stopTranscoding(torrent) {
        Object.keys(transcoders).forEach((key) => {
            const transcoder = transcoders[key]
            if (transcoder.torrentHash == torrent.infoHash) {
                transcoder.kill()
            }
            delete transcoders[key]
        })

        Object.keys(hlsTanscoders).forEach((key) => {
            const transcoder = hlsTanscoders[key]
            if (transcoder.torrentHash == torrent.infoHash) {
                transcoder.kill()
            }
            delete hlsTanscoders[key]
        })

        cleanUpHlsData(torrent.infoHash)
    },
    getTranscoder(clientId) {
        if(!TRANSCODING_ENABLED) 
            throw new Error('Transcoding not avalaible')

        let transcoder = transcoders[clientId]
        if (!transcoder) {
            transcoder = new Transcoder(clientId)
            transcoders[clientId] = transcoder
            return transcoder
        }

        return transcoder
    },
    getHLSTranscoder(torrent, fileIndex) {
        if(!TRANSCODING_ENABLED) 
            throw new Error('Transcoding not avalaible')

        const key = `${torrent.infoHash}_${fileIndex}`

        let transcoder = hlsTanscoders[key]
        if (!transcoder) {
            transcoder = new HLSTranscoder(torrent, fileIndex)
            hlsTanscoders[key] = transcoder
            return transcoder
        }

        return transcoder
    }
}

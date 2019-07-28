const express = require('express')
const asyncHandler = require('express-async-handler')
const superagent = require('superagent')
const m3u8 = require('m3u8-parser')
const m3u8stream = require('m3u8stream')
const { WEB_PORT } = require('../config')
const { DLNA_ORIGIN_FLAGS } = require('../dlna/dlnaFlags')
const { getExtractorUrl, formatDLNADuration, parseRange } = require('../utils')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
    const { manifestUrl, extractor } = req.query

    let time = 0
    const dlnaTimeSeek = req.header('TimeSeekRange.dlna.org')
    if (dlnaTimeSeek) {
        const ranges = parseRange(dlnaTimeSeek)
        time = ranges[0].start
    } else if (req.query.start) {
        time = parseInt(req.query.start)
    }

    let playlistUrl = manifestUrl
    if(!manifestUrl.endsWith('mpd')) {
        const parser = new m3u8.Parser()

        const res = await superagent
            .get(getExtractorUrl(playlistUrl, extractor))
            .buffer(true)

        parser.push(res.text)
        parser.end()

        const { playlists } = parser.manifest

        if(playlists && playlists.length > 0) {
            playlistUrl = playlists[0].uri //getExtractorUrl(playlists[0].uri, extractor)
        }
    }

    if(playlistUrl.startsWith('/')) {
        playlistUrl = `http://localhost:${WEB_PORT}${playlistUrl}`
    }

    res.set({
        'ContentFeatures.dlna.org': `DLNA.ORG_OP=01;DLNA.ORG_FLAGS=${DLNA_ORIGIN_FLAGS}`,
        'Content-Type': 'video/mpeg',
        'TransferMode.dlna.org': 'Streaming',
        'Content-Disposition': 'attachment'
    })

    m3u8stream(playlistUrl, { begin: time })
        .once('progress', ({ duration }) => {
            if(!res.headersSent) {
                const durationFormated = formatDLNADuration(duration)
                const timeFormated = formatDLNADuration(time)

                res.set({
                    'TimeSeekRange.dlna.org': 'npt=' + timeFormated + '-' + durationFormated + '/' + durationFormated,
                    'X-Seek-Range': 'npt=' + timeFormated + '-' + durationFormated + '/' + durationFormated
                })
            }
        })
        .pipe(res)
}))

module.exports = router
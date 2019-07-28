const express = require('express')
const asyncHandler = require('express-async-handler')
const fs = require('fs')
const path = require('path')
const mimeLookup = require('mime-types').lookup
const torrentsService = require('../service/torrents')
const metadataService = require('../service/metadata')
const dlnaProfileName = require('../dlna/dlnaProfileName')
const { DLNA_ORIGIN_FLAGS } = require('../dlna/dlnaFlags')
const checkIfTorrentFileReady = require('../service/torrents/checkIfTorrentFileReady')
const tanscoderSettings = require('../service/transcode/settings')
const torrentPlaylist = require('../service/torrents/torrentPlaylist')
const transcodeService = require('../service/transcode')
const ResponseError = require('../utils/ResponseError')
const mapTorrent = require('../utils/mapTorrent')
const { isVideo, parseRange, formatDLNADuration } = require('../utils')
const { TORRENTS_DATA_DIR } = require('../config')

const router = express.Router()

// get all torrent
router.get('/', (_, res) => {
    res.json(
        torrentsService.getTorrents()
            .map((torrent) => res.json(mapTorrent(torrent, true)))
    )
})

// add torrents
router.post('/', asyncHandler(async (req, res) => {
    if (!req.body.magnetUrl && !req.body.torrentUrl)
        throw new ResponseError('magnetUrl or torrentUrl reuired')

    const torrent = await torrentsService.addTorrent(req.body)
    
    res.json(mapTorrent(torrent, true))
}))

// get torrent by id
router.get('/:id', (req, res) => {
    const torrent = torrentsService.getTorrent(req.params.id)
    if(torrent)
        res.json((torrent) => res.json(mapTorrent(torrent, true)))
    else
        throw new ResponseError('Torrent not found', 404)
})

// get torrent by id
router.get('/:id/progress', (req, res) => {
    const torrent = torrentsService.getTorrent(req.params.id)
    if(torrent)
        res.json(mapTorrent.progress(torrent))
    else
        throw new ResponseError('Torrent not found', 404)
})

// create torrent playlist
router.get('/:torrentId/playlist', (req, res) => {
    const { torrentId } = req.params

    const torrent = torrentsService.getTorrent(torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    res.json(torrentPlaylist(torrent))
})

// delete torrent by id
router.delete('/:id', (req, res, next) => {
    torrentsService
        .removeTorrent(req.params.id)
        .then(() => res.json({ status: 'OK' }))
        .catch(next)
})

// change torrent backgroud download status
router.post('/:torrentId/backgroundDownload', (req, res) => {
    const { torrentId } = req.params
    const { enabled } = req.body

    torrentsService.setTorrentBackgroundDownload(torrentId, enabled)

    res.json({ status: 'OK' })
})


router.head('/:torrentId/files/:fileId', asyncHandler(async (req, res) => {
    const { file } = getTorrentAndFile(req)
    
    res.set('Accept-Ranges', 'bytes')
    res.set('Content-Type', mimeLookup(file.name))
    res.set('Content-Length', file.length)
    res.set('Content-Disposition', `attachment; filename="${file.name}"`)

    if(req.header('getcontentfeatures.dlna.org')) {
        await setDlnaContentFeaturesHeader(file, res)
    }

    res.end()
}))

// get torrent file
router.get('/:torrentId/files/:fileId', asyncHandler(async (req, res) => {
    const { file } = getTorrentAndFile(req)

    if(req.header('getcontentfeatures.dlna.org')) {
        await setDlnaContentFeaturesHeader(file, res)
    }

    writeFileRange(file, req, res)
}))

router.get('/:torrentId/files/:fileId/browserVideo', asyncHandler(async (req, res) => {
    const { file } = getTorrentAndFile(req)

    if (!isVideo(file.path))
        throw new ResponseError('Not video file', 404)

    const supported = await metadataService.isBrowserSupportedVideo(file)

    if(!supported) {
        res.sendStatus(404)
    } else {
        writeFileRange(file, req, res)
    }
}))

router.head('/:torrentId/files/:fileId/transcoded', (req, res) => {
    let { clientId } = req.query

    if (!clientId) {
        clientId = req.socket.remoteAddress
    }

    const { dlnaFeatures } = tanscoderSettings(clientId)
    res.set({
        'Content-Type': 'video/mpeg',
        'ContentFeatures': dlnaFeatures
    })
    res.end()
})

// get torrent video file transcoded stream
router.get('/:torrentId/files/:fileId/transcoded', asyncHandler(async (req, res) => {
    const { torrent, file } = getTorrentAndFile(req)
    let { clientId } = req.query

    if (!clientId) {
        clientId = req.socket.remoteAddress
    }
    if (!isVideo(file.path)) throw new ResponseError('Not video file', 400)

    let start = 0, duration = 0
    const dlnaTimeSeek = req.header('TimeSeekRange.dlna.org')

    if (dlnaTimeSeek) {
        const ranges = parseRange(dlnaTimeSeek)
        start = ranges[0].start
    } else if (req.query.start) {
        start = parseInt(req.query.start)
    }

    if (req.query.duration) {
        duration = parseInt(req.query.duration)
    }

    if (isNaN(start)) start = 0
    if (isNaN(duration)) duration = 0

    const transcoder = transcodeService.getTranscoder(clientId)
    const { stream, metadata } = await transcoder.transcode(torrent, file, start, duration)

    const { dlnaFeatures } = tanscoderSettings(clientId)
    const headers = {
        'Content-Type': 'video/mpegts',
        'TransferMode.dlna.org': 'Streaming',
        'ContentFeatures.dlna.org': dlnaFeatures,
        'Content-Disposition': `attachment; filename="${file.name}"`
    }

    if(metadata) {
        const duration = formatDLNADuration(metadata.duration)
        const startTime = formatDLNADuration(start)
        headers['TimeSeekRange.dlna.org'] = 'npt=' + startTime + '-' + duration + '/' + duration
        headers['X-Seek-Range'] = 'npt=' + startTime + '-' + duration + '/' + duration
    }

    res.writeHead(200, headers)
    res.once('close', () => transcoder.idle())

    stream.pipe(res)
}))

// get torrent video file hls m3u file
router.get('/:torrentId/files/:fileId/hls', asyncHandler(async (req, res) => {
    const { torrent, fileId } = getTorrentAndFile(req)

    const transcoder = await transcodeService
        .getHLSTranscoder(torrent, fileId)
        .transcode(req.query.hasOwnProperty('force'))

    const file = await transcoder.readM3U8()

    res.set('Content-Type', 'application/x-mpegURL')
    res.end(file)
}))

// notify server to not stop hls transcoding
router.get('/:torrentId/files/:fileId/hls/keepAlive', (req, res) => {
    const { torrent, fileId } = getTorrentAndFile(req)

    transcodeService
        .getHLSTranscoder(torrent, fileId)
        .keepAlive()

    res.json('OK')
})

// get torrent file hls segment
router.get('/:torrentId/files/:fileId/hls/:segment', (req, res) => {
    const { torrent, fileId } = getTorrentAndFile(req)

    const transcoder = transcodeService.getHLSTranscoder(torrent, fileId)

    res.set('Content-Type', 'video/mp2ts')

    transcoder.getSegment(req.params.segment).pipe(res)
})

async function setDlnaContentFeaturesHeader(file, res) {
    const [ profileName,  contentType ] = await dlnaProfileName(file)
    if (profileName) {
        res.set('ContentFeatures.dlna.org', `DLNA.ORG_PN=${profileName};DLNA.ORG_OP=01;DLNA.ORG_FLAGS=${DLNA_ORIGIN_FLAGS}`)
    } else {
        res.set('ContentFeatures.dlna.org', '*')
    }

    if(contentType) {
        res.set('Content-Type', contentType)
    }
}

function getTorrentAndFile(req) {
    const { torrentId, fileId } = req.params

    const torrent = torrentsService.getTorrent(torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    const file = torrent.files[fileId]
    if (!file) throw new ResponseError('File not found', 404)

    return { torrentId, torrent, fileId, file }
}

function writeFileRange(file, req, res) {
    // indicate this resource can be partially requested
    res.set('Accept-Ranges', 'bytes')
    res.set('Content-Type', mimeLookup(file.name))
    res.set('Content-Disposition', 'attachment')
    res.set('Content-Disposition', `attachment; filename="${file.name}"`)
    // if this is a partial request

    var ranges = req.range(file.length)

    if (ranges === -1)
        throw new ResponseError('Malformed range', 400)

    if (ranges === -2)
        throw new ResponseError('Unsatisfiable ranges', 416)

    if (ranges && ranges.type === 'bytes') {
        // parse ranges

        if (ranges.length > 1) {
            throw new ResponseError('Multiple ranges not supported', 416)
        }

        var start = ranges[0].start
        var end = ranges[0].end

        res.writeHead(206, {
            'Content-Length': (end - start) + 1,
            'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
        })

        // slicing the stream to partial content
        createFileStream(file, { start, end }).pipe(res)
    } else {
        res.writeHead(200, {
            'Content-Length': file.length,
            'Content-Range': 'bytes 0-' + file.length
        })
        createFileStream(file).pipe(res)
    }
}

function createFileStream(file, opts) {
    if (checkIfTorrentFileReady(file)) {
        return fs.createReadStream(path.join(TORRENTS_DATA_DIR, file.path), opts)
    }
    return file.createReadStream(opts)
}

module.exports = router
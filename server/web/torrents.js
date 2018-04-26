const express = require('express')
const rangeParser = require('range-parser')
const torrentsService = require('../service/torrents')
const transcodeService = require('../service/transcode')
const ResponseError = require('../utils/ResponseError')
const pick = require('lodash/pick')
const { isVideo } = require('../utils')


const router = express.Router()

router.get('/', (req, res) => {
    res.json(torrentsService.getTorrents().map(mapTorrent))
})

router.post('/', (req, res, next) => {
    if (!req.body.magnetUrl)
        throw new ResponseError('magnetUrl reuired')

    torrentsService.addTorrent(req.body.magnetUrl)
        .then((torrent) => res.json(mapTorrent(torrent)))
        .catch(next)
})

router.get('/:id', (req, res) => {
    res.json(mapTorrent(torrentsService.getTorrent(req.params.id)))
})

router.delete('/:id', (req, res, next) => {
    torrentsService
        .removeTorrent(req.params.id)
        .then(() => res.json({ status: 'OK' }))
        .catch(next)
})

router.get('/:torrentId/files/:fileId', (req, res) => {
    const torrent = torrentsService.getTorrent(req.params.torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    const file = torrent.files[req.params.fileId]
    if (!file) throw new ResponseError('File not found', 404)

    writeFileRange(file, req, res)
})

router.get('/:torrentId/files/:fileId/transcoded', (req, res, next) => {
    const torrent = torrentsService.getTorrent(req.params.torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    const fileId = req.params.fileId
    const file = torrent.files[fileId]
    if (!file) throw new ResponseError('File not found', 404)
    if (!isVideo(file.path)) throw new ResponseError('Not video file', 400)

    transcodeService.getTranscodedFile(torrent, fileId)
        .then((transcodingFile) => {
            if (transcodingFile.isCompleted) {
                writeFileRange(transcodingFile, req, res)
            } else {
                res.set('Accept-Ranges', 'none')
                res.connection.on('close', () => {
                    transcodingFile.requestStop()
                })
                transcodingFile.createReadStream().pipe(res)
            }
        })
        .catch(next)
})

function writeFileRange(file, req, res) {
    // indicate this resource can be partially requested
    res.set('Accept-Ranges', 'bytes')
    res.set('Content-Length', file.length)
    // if this is a partial request
    if (req.headers.range) {
        // parse ranges
        var ranges = rangeParser(file.length, req.headers.range)
        if (ranges === -2)
            throw new ResponseError('Malformed range', 400)

        if (ranges === -1) {
            // unsatisfiable range
            res.set('Content-Range', '*/' + file.length)
            throw new ResponseError('Unsatisfiable ranges', 416)
        }

        if (ranges.type !== 'bytes') {
            file.createReadStream().pipe(res)
            return
        }

        if (ranges.length > 1) {
            throw new ResponseError('Multiple ranges not supported', 416)
        }

        var start = ranges[0].start
        var end = ranges[0].end
        // formatting response
        res.status(206)
        res.set('Content-Length', (end - start) + 1) // end is inclusive
        res.set('Content-Range', 'bytes ' + start + '-' + end + '/' + file.length)
        // slicing the stream to partial content
        file.createReadStream({ start, end }).pipe(res)
    } else {
        file.createReadStream().pipe(res)
    }
}

function mapTorrent(torrent) {
    const filterdTorrent = pick(torrent, [
        'infoHash',
        'name',
        'timeRemaining',
        'received',
        'downloaded',
        'uploaded',
        'downloadSpeed',
        'uploadSpeed',
        'ratio',
        'numPeers',
        'path',
        'files'
    ])

    const filtredFiles = filterdTorrent.files.map(file => pick(file, [
        'name',
        'path',
        'length',
        'downloaded',
        'progress'
    ]))
    filterdTorrent.files = filtredFiles

    return filterdTorrent
}

module.exports = router
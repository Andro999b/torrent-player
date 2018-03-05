const express = require('express')
const rangeParser = require('range-parser')

const torrentsService = require('../service/torrents')
const ResponseError = require('../utils/ResponseError')
const pick = require('lodash/pick')

const router = express.Router()

router.get('/', (req, res) => {
    res.json(torrentsService.getTorrents().map(mapTorrent))
})

router.put('/', (req, res) => {
    if (!req.body.magnet_link)
        throw new ResponseError('magnet_link reuired')

    res.json(mapTorrent(torrentsService.addTorrent(req.body.magnet_link)))
})

router.get('/:id', (req, res) => {
    res.json(mapTorrent(torrentsService.getTorrent(req.params.id)))
})

router.delete('/:id', (req, res, next) => {
    torrentsService
        .removeTorrent(req.params.id)
        .then(() => res.sendStatus(200))
        .catch(next)
})

router.get('/:torrentId/files/:fileId/stream', (req, res) => {
    const torrent = torrentsService.getTorrent(req.params.torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    const file = torrent.files[req.params.fileId]
    if (!file) throw new ResponseError('File not found', 404)

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
})

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
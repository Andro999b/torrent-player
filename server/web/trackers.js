const express = require('express')
const trackers = require('../service/trackers')

const router = express.Router()

router.get('/', (req, res) => {
    res.json(trackers.getTrackers())
})

router.get('/:trackerName/search', (req, res, next) => {
    const trackerName = req.params.trackerName
    const query = req.query.q
    const page = req.query.page || 1

    if (!query) {
        res.json([])
        return
    }

    trackers.search(trackerName, query, page)
        .then(r => res.json(r))
        .catch(next)
})

router.get('/:trackerName/torrents/:torrentId', (req, res, next) => {
    const trackerName = req.params.trackerName
    const torrentId = req.params.torrentId

    trackers.getTorrentInfo(trackerName, torrentId)
        .then(r => res.json(r))
        .catch(next)
})

module.exports = router


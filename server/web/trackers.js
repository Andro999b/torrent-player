const express = require('express')
const trackers = require('../service/trackers')

const router = express.Router()

router.get('/', (_, res) => {
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
        .then((r) => res.json(r))
        .catch(next)
})

router.get('/:trackerName/items/:resultId', (req, res, next) => {
    const trackerName = req.params.trackerName
    const resultId = req.params.resultId

    trackers.getInfo(trackerName, resultId)
        .then((r) => res.json(r))
        .catch(next)
})

module.exports = router


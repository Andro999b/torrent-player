const express = require('express')
const asyncHandler = require('express-async-handler')
const trackers = require('../service/trackers')

const router = express.Router()

router.get('/', (_, res) => {
    res.json(trackers.getTrackers())
})

router.get('/:trackerName/search', asyncHandler(async (req, res) => {
    const trackerName = req.params.trackerName
    const query = req.query.q
    const page = req.query.page || 1

    if (!query) {
        res.json([])
        return
    }

    res.json(await trackers.search(trackerName, query, page))
}))

router.get('/:trackerName/items/:resultId', asyncHandler(async (req, res) => {
    const trackerName = req.params.trackerName
    const resultId = req.params.resultId

    res.json(await trackers.getInfo(trackerName, resultId))
}))

module.exports = router


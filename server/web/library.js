const express = require('express')
const torrentsService = require('../service/torrents')
const continueWatchingService = require('../service/bookmarks')
const mapTorrent = require('../utils/mapTorrent')
const asyncHandler = require('express-async-handler')

const router = express.Router()

router.get('/', asyncHandler(async (_, res) => {
    const bookmarks = await continueWatchingService.getAllBookmarks()

    res.json({
        bookmarks: bookmarks.sort((s1, s2) => s2.ts - s1.ts),
        torrents: torrentsService
            .getTorrents()
            .map((torrent) => mapTorrent(torrent, true))
    })
}))

router.delete('/bookmarks/:playlistId', asyncHandler(async (req, res) => {
    await continueWatchingService.remove(req.params.playlistId)
    res.json({ status: 'OK' })
}))

router.post('/bookmarks/:playlistId', asyncHandler(async (req, res) => {
    await continueWatchingService.update(req.params.playlistId, req.body)
    res.json({ status: 'OK' })
}))


router.post('/bookmarks', asyncHandler(async (req, res) => {
    const playerState = await continueWatchingService.addPlaylist(req.body)
    res.json(playerState)
}))


module.exports = router
const express = require('express')
const torrentsService = require('../service/torrents')
const continueWatchingService = require('../service/bookmarks')
const mapTorrent = require('../utils/mapTorrent')

const router = express.Router()

router.get('/', (req, res) => {
    const bookmarks = continueWatchingService.getAllBookmarks()
        .sort((s1, s2) => s2.ts - s1.ts)

    res.json({
        bookmarks,
        torrents: torrentsService.getTorrents().map(mapTorrent)
    })
})

router.delete('/bookmarks/:playlistName', (req, res) => {
    continueWatchingService.remove(req.params.playlistName)
    res.json({ status: 'OK' })
})

router.post('/bookmarks', (req, res) => {
    const playerState = continueWatchingService.addPlaylist(req.body)
    res.json(playerState)
})


module.exports = router
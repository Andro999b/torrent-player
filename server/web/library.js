const express = require('express')
const torrentsService = require('../service/torrents')
const continueWatchingService = require('../service/continueWatching')
const mapTorrent = require('../utils/mapTorrent')

const router = express.Router()

router.get('/', (req, res) => {
    const continueWatching = continueWatchingService.getAll()
        .sort((s1, s2) => 
            s1.playlist.name.localeCompare(s2.playlist.name)
        )

    res.json({
        continueWatching,
        torrents: torrentsService.getTorrents().map(mapTorrent)
    })
})

router.delete('/continueWatching/:playlistName', (req, res) => {
    continueWatchingService.remove(req.params.playlistName)
    res.json({ status: 'OK' })
})

router.post('/continueWatching', (req, res) => {
    const playerState = continueWatchingService.addPlaylist(req.body)
    res.json(playerState)
})


module.exports = router
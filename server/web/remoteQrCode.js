const qr = require('qr-image')
const { WEB_PORT, HOSTNAME } = require('../config')
const express = require('express')
const router = express.Router()

const qrImage = qr.imageSync(`http://${HOSTNAME}:${WEB_PORT}`, { type: 'svg' })

router.get('/', (req, res) => {
    res.set('Content-Type', 'image/svg+xml')
    res.send(qrImage)
})


module.exports = router
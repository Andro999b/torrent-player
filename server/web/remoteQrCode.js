const qr = require('qr-image');
const ip = require('ip')
const { WEB_PORT } = require('../config')
const express = require('express')
const router = express.Router()

const qrImage = qr.imageSync(`http://${ip.address()}:${WEB_PORT}`, { type: 'svg' })

router.get('/', (req, res) => {
    res.set('Content-Type', 'image/svg+xml')
    res.send(qrImage)
})


module.exports = router
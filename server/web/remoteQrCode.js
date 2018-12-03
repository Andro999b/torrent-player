const qr = require('qr-image');
const ip = require('ip')
const { WEB_PORT } = require('../config')
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    const address = `http://${ip.address()}:${WEB_PORT}`

    res.set('Content-Type', 'image/svg+xml')
    qr.image(address, { type: 'svg' }).pipe(res)
})


module.exports = router
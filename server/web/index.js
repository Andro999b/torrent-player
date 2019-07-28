const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const torrentsApi = require('./torrents')
const trackersApi = require('./trackers')
const suggestionsApi = require('./suggestions')
const libraryApi = require('./library')
const proxyMedia = require('./proxyMedia')
const extractVideo = require('./extractVideo')
const videoStreamConcat = require('./videoStreamConcat')
const remote = require('./remote')
const remoteQrCode = require('./remoteQrCode')

const { INTERNAL_WEB_PORT, CLIENT_DIR, CLIENT_CONFIG } = require('../config')

module.exports = function () {
    const expressServer = express()

    expressServer.use(cors())
    expressServer.use(express.static(CLIENT_DIR))

    expressServer.use(bodyParser.json())
    expressServer.use('/api/torrents', torrentsApi)
    expressServer.use('/api/trackers', trackersApi)
    expressServer.use('/api/library', libraryApi)
    expressServer.use('/api/suggestions', suggestionsApi)
    expressServer.use('/proxyMedia', proxyMedia)
    expressServer.use('/extractVideo', extractVideo)
    expressServer.use('/remoteQrCode', remoteQrCode)
    expressServer.use('/videoStreamConcat', videoStreamConcat)

    expressServer.get('/api/ping', (_, res) => res.status(200).send('pong'))
    expressServer.get('/api/config', (_, res) => res.json(CLIENT_CONFIG))

    // eslint-disable-next-line no-unused-vars
    expressServer.use((err, req, res, next) => {
        if (typeof err === 'string') {
            console.error(err)

            res.status(500)
            res.json({ error: err})
        } else {
            console.error(req.method, req.url, req.query, err.stack)

            try {
                res.status(err.code || 500)
                res.json({ error: err.message || 'Something gones worng' })
            } catch (err) {
                res.status(500)
                res.json({ error: 'Something gones worng' })
            }
        }
    })

    // eslint-disable-next-line no-console
    const httpServer = expressServer.listen(INTERNAL_WEB_PORT, () => console.log(`WEB Server started at port ${INTERNAL_WEB_PORT}`))

    remote(httpServer)

    return {expressServer, httpServer}
}
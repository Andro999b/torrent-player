const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const torrentsApi = require('./torrents')
const trackersApi = require('./trackers')
const suggestionsApi = require('./suggestions')
const proxyMedia = require('./proxyMedia')
const extractVideo = require('./extractVideo')
const remote = require('./remote')
const { WEB_PORT, CLIENT_DIR } = require('../config')

module.exports = function () {
    const expressServer = express()

    expressServer.use(cors())
    expressServer.use(express.static(CLIENT_DIR))

    expressServer.use(bodyParser.json())
    expressServer.use('/api/torrents', torrentsApi)
    expressServer.use('/api/trackers', trackersApi)
    expressServer.use('/api/suggestions', suggestionsApi)
    expressServer.use('/proxyMedia', proxyMedia)
    expressServer.use('/extractVideo', extractVideo)

    // eslint-disable-next-line no-unused-vars
    expressServer.use((err, req, res, next) => {
        if (typeof err === 'string') {
            console.error(err)

            res.status(500)
            res.json({ error: err})
        } else {
            console.error(err.stack)

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
    const httpServer = expressServer.listen(WEB_PORT, () => console.log(`WEB Server started at port ${WEB_PORT}`))

    remote(httpServer)

    return {expressServer, httpServer}
}
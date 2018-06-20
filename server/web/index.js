const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const torrentsApi = require('./torrents')
const trackersApi = require('./trackers')
const suggestionsApi = require('./suggestions')
const proxyMedia = require('./proxyMedia')
const path = require('path')
const { WEB_PORT } = require('../config')

module.exports = function () {
    const app = express()

    app.use(cors())
    app.use(express.static(path.join('client', 'dist')))

    app.use(bodyParser.json())
    app.use('/api/torrents', torrentsApi)
    app.use('/api/trackers', trackersApi)
    app.use('/api/suggestions', suggestionsApi)
    app.use('/proxyMedia', proxyMedia)

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
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
    app.listen(WEB_PORT, () => console.log(`WEB Server started at port ${WEB_PORT}`))

    return app;
}
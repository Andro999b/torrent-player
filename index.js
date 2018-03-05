const express = require('express')
const bodyParser = require('body-parser')
const torrentsApi = require('./server/api/torrents')
const trackersApi = require('./server/api/trackers')
const path = require('path')

const PORT = 8080

const app = express()

app.use(express.static(path.join(__dirname, 'client', 'dist')))

app.use(bodyParser.json())
app.use('/api/torrents', torrentsApi)
app.use('/api/trackers', trackersApi)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err.stack)

    try {
        res.status(err.code || 500)
        res.json({ error: err.message || 'Something gones worng' })
    } catch (err) {
        res.status(500)
        res.json({ error: 'Something gones worng' })
    }
})

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Server started at port ${PORT}`))

process.on('uncaughtException', function (err) {
    console.error(err)
})
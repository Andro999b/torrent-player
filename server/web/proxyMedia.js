const superagent = require('superagent')
const express = require('express')
const ResponseError = require('../utils/ResponseError')

const router = express.Router()
const PROXY_HEADERS = ['Content-Type', 'Content-Length', 'Cache-Control', 'ETag', 'Expires', 'Date', 'Last-Modified']

router.get('/', (req, res, next) => {
    const { url } = req.query

    if (!url) {
        throw new ResponseError('url parameter required')
    }

    superagent
        .get(url)
        .buffer(true)
        .parse(superagent.parse.image) 
        .then((proxyRes) => {
            PROXY_HEADERS.forEach((headerName) => {
                const header = proxyRes.header[headerName]
                if(header) res.set(headerName, header)
            })
            res.end(proxyRes.body)
        })
        .catch(next)
})


module.exports = router
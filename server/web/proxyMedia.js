const request = require('superagent')
const express = require('express')
const ResponseError = require('../utils/ResponseError')

const router = express.Router()

router.get('/', (req, res, next) => {
    const url = req.query.url

    if (!url) {
        throw new ResponseError('url parameter requred')
    }

    request.get(url)
        .then((proxyRes) => {
            Object.keys(proxyRes.header).forEach((headerName) => {
                const header = proxyRes.header[headerName]
                res.setHeader(headerName, header)
            })
            res.contentType = proxyRes.contentType
            res.end(proxyRes.body)
        })
        .catch(next)
})


module.exports = router
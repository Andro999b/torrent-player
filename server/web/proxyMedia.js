const superagent = require('superagent')
const express = require('express')
const ResponseError = require('../utils/ResponseError')
const { PROXY_HEADERS } = require('../config')

const router = express.Router()

router.get('/', (req, res, next) => {
    const { url } = req.query

    if (!url) {
        throw new ResponseError('url parameter required')
    }

    superagent
        .get(url)
        .buffer(true)
        .parse(superagent.parse.image)
        .on('error', next)
        .on('response', (resp) => 
            PROXY_HEADERS.forEach((headerName) => {
                const header = resp.header[headerName]
                if(header) res.set(headerName, header)
            })
        )
        .pipe(res)
})


module.exports = router
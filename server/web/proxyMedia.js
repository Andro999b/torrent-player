const superagent = require('superagent')
const express = require('express')
const ResponseError = require('../utils/ResponseError')

const router = express.Router()

router.get('/', (req, res) => {
    const { url } = req.query

    if (!url) {
        throw new ResponseError('url parameter required')
    }

    superagent.get(url).pipe(res)
})


module.exports = router
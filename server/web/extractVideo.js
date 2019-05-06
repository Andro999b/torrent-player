const express = require('express')
const extractVideo = require('../service/extractVideo')
const ResponseError = require('../utils/ResponseError')

const router = express.Router()

router.get('/', (req, res, next) => {
    const { type, url } = req.query

    if(!type || !url)
        throw new ResponseError('url and type parameters required')

    extractVideo(type, url)
        .then((videoUrl) => {
            res.redirect(videoUrl)
        })
        .catch(next)
})

module.exports = router
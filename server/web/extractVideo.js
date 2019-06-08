const express = require('express')
const asyncHandler = require('express-async-handler')
const extractVideo = require('../service/extractVideo')
const ResponseError = require('../utils/ResponseError')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
    const { type, url } = req.query

    if(!type || !url)
        throw new ResponseError('url and type parameters required')

    await extractVideo(req.query, res)
}))

module.exports = router
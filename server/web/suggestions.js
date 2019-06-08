const express = require('express')
const asyncHandler = require('express-async-handler')
const suggestionsService = require('../service/suggestions')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
    const query = req.query.q

    if (!query) {
        res.json([])
        return
    }

    const suggestions = suggestionsService.suggest(query)
    
    res.json(suggestions)
}))

module.exports = router
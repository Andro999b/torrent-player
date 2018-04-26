const express = require('express')
const suggestionsService = require('../service/suggestions')

const router = express.Router()

router.get('/', (req, res, next) => {
    const query = req.query.q

    if (!query) {
        res.json([])
        return
    }

    suggestionsService
        .suggest(query)
        .then((suggestions) => res.json(suggestions))
        .catch(next)
})


module.exports = router
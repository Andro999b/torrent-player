const request = require('superagent')

module.exports = {
    async suggest(searchQuery) {
        const res = await request.get('http://suggestqueries.google.com/complete/search')
            .query({
                q: searchQuery,
                client: 'firefox'
            })
        return JSON.parse(res.text)[1]
    }
}
const request = require('superagent')

module.exports = {
    async suggest(searchQuery) {
        const res = await request.get('https://clients1.google.com/complete/search')
            .query({
                q: searchQuery,
                client: 'firefox'
            })
        return JSON.parse(res.text)[1]
    }
}
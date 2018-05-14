const request = require('superagent')

module.exports = {
    suggest(searchQuery) {
        return request.get('https://clients1.google.com/complete/search')
            .query({
                q: searchQuery,
                client: 'firefox'
            })
            .then((res) => {
                return JSON.parse(res.text)[1]
            })
    }
}
const Provider = require('../Provider')
const requestFactory = require('../../../utils/requestFactory')
const urlencode = require('urlencode')

class DataLifeProvider extends Provider {
    getType() {
        return 'directMedia'
    }

    getSearchUrl() {}

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }

    _getSiteEncoding() {
        return null
    }

    _crawlerSearchRequestGenerator(query) {
        const { searchUrl, headers, useProxy, timeout } = this.config
        const encoding = this._getSiteEncoding()

        return () => {
            const request = requestFactory({ proxy: useProxy })
                .post(searchUrl)
                .type('form')
                .field({ 
                    do: 'search',
                    subaction: 'search',
                    search_start: 0,
                    full_search: 0,
                    result_from: 1,
                    story: encoding ? urlencode.encode(query, encoding) : query
                })
                .buffer(true)
                .charset()
                .timeout(timeout)
                .set(headers)

            return request
        }
    }
}

module.exports = DataLifeProvider
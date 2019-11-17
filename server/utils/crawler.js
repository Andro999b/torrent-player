const requestFactory = require('./requestFactory')
const { BaseCrawler } = require('./baseCrawler')

class Crawler extends BaseCrawler {
    constructor(url, requestGenerator) {
        super(url, requestGenerator || (async (nextUrl) => {
            const targetUrl = nextUrl != this._url ? 
                new URL(nextUrl, this._url).toString() :
                nextUrl

            const request = requestFactory({ proxy: this._useProxy })
                .get(targetUrl)
                .buffer(true)
                .charset()
                .timeout(this._timeoutMs)
                .set(this._headers)

            return request
        }))
        this._useProxy = false
    }

    proxy(useProxy) {
        this._useProxy = useProxy
        return this
    }

    timeout(ms) {
        this._timeoutMs = ms
    }
}

module.exports = {
    Crawler,
    get(url, requestGenerator) {
        return new Crawler(url, requestGenerator)
    }
}

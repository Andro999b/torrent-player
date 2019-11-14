const requestFactory = require('../../utils/requestFactory')
const { PROXY_HEADERS, PROVIDERS_CONFIG } = require('../../config')

module.exports = async ({ url, referer }, res) => {
    let targetUrl

    if(url.startsWith('https://anime') || url.startsWith('https://online')) {
        targetUrl = url.split('url=')[0]
        targetUrl = targetUrl.replace('index', 'noad')
        referer = url
    } else {
        targetUrl = url
    }

    const useProxy = PROVIDERS_CONFIG['anidub'].useProxy || PROVIDERS_CONFIG.proxyAll

    requestFactory({ proxy: useProxy })
        .get(targetUrl)
        .set({
            'Referer': referer
        })
        .on('error', () => {
            res.end()
        })
        .on('response', (resp) => 
            PROXY_HEADERS.forEach((headerName) => {
                const header = resp.header[headerName]
                if(header) res.set(headerName, header)
            })
        )
        .pipe(res)
}
const superagent = require('superagent')
const { PROXY_HEADERS } = require('../../config')

module.exports = async ({ url }, res) => {
    superagent
        .get(url)
        .on('error', () => {
            res.end()
        })
        .on('response', (resp) => 
            PROXY_HEADERS.forEach((headerName) => {
                const header = resp.header[headerName]

                res.set('Content-Disposition', 'attachment')
                
                if(header) res.set(headerName, header)
            })
        )
        .pipe(res)
}
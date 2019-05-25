const { toJson } = require('really-relaxed-json') 
const crypto = require('crypto')
const superagent = require('superagent')
const { PROXY_HEADERS } = require('../../config')

const key = Buffer.from('9186a0bae4afec34c323aecb7754b7c848e016188eb8b5be677d54d3e70f9cbd', 'hex') 
const iv = Buffer.from('2ea2116c80fae4e90c1e2b2b765fcc45', 'hex')

module.exports = async ({ url, referer }, res) => {
    let targetUrl

    if(url.startsWith('https://edge')) {
        targetUrl = url
    } else {
        const agent = superagent.agent()
        const iframeRes = await agent
            .get(url)
            .set({
                'Referer': referer
            })

        const matches = iframeRes.text.match(/var video_balancer_options = ([^;]+);/)
        const options = JSON.parse(toJson(matches[1]))

        const USER_AGENT = 'Mozilla/5.0 Gecko/20100101 Firefox/59.0'
        const item = {
            a : options.partner_id,
            b : options.domain_id,
            c : false,
            d : options.player_skin,
            e : options.video_token,
            f : USER_AGENT
        }

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
        let encrypted = cipher.update(JSON.stringify(item), 'utf8', 'base64')
        encrypted += cipher.final('base64')

        const vsReferer = iframeRes.redirects[iframeRes.redirects.length - 1]
        const vsRes = await agent
            .post('https://streamguard.cc/vs')
            .type('form')
            .field({
                q: encrypted,
                ref: options.ref
            })
            .set({
                'User-Agent': USER_AGENT,
                'Referer': vsReferer
            })

        targetUrl = vsRes.body.m3u8
    }

    superagent
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
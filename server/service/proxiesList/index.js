const superagent = require('superagent')
const superagentProxy = require('superagent-proxy')
const { chunk } = require('lodash')

async function getProxies(region) {
    const iso = region.toUpperCase()
    const res = await superagent
        .get(`https://www.proxy-list.download/api/v1/get?country=${iso}&type=http`)

    return res.text
        .split('\r\n')
        .filter((it) => it)
        .map((address) => `http://${address}`)
}


async function checkProxy(proxyUrl, checkUrl, checkTimeout) {
    try {
        await superagentProxy(superagent.get(checkUrl), proxyUrl)
            .timeout(checkTimeout)

        return true
    } catch (e) {
        console.log(`Proxy server ${proxyUrl} didnt pass check`) // eslint-disable-line no-console
        return false
    }
}

module.exports = {
    checkProxy,
    findProxy: async (region, checkUrl, checkTimeout) => {
        const proxies = await getProxies(region)
        const chunks = chunk(proxies, 10)

        for (const proxiesChunk of chunks) {
            const checkProxies = await Promise.all(
                proxiesChunk.map(async (proxy) => {
                    if(await checkProxy(proxy, checkUrl, checkTimeout))
                        return proxy
                    return null
                })
            )

            for (const proxy of checkProxies) {
                if(proxy) return proxy
            }
        }

        return null
    }
}
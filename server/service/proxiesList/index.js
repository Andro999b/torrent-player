const superagent = require('superagent')
const superagentProxy = require('superagent-proxy')

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

        for (const proxy of proxies) {
            if(await checkProxy(proxy, checkUrl, checkTimeout))
                return proxy
        }

        return null
    }
}
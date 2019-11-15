const superagent = require('superagent')

module.exports = async (region) => {
    const iso = region.toUpperCase()
    const res = await superagent
        .get(`https://www.proxy-list.download/api/v1/get?country=${iso}&type=http`)

    return res.text
        .split('\r\n')
        .filter((it) => it)
        .map((address) => `http://${address}`)
}
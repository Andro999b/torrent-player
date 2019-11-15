const superagent = require('superagent')

module.exports = async (region) => {
    const iso = region.toUpperCase()
    const res = await superagent
        .get('https://www.proxy-list.download/api/v0/get?l=en&t=http')
        .buffer(true)
        .parse(superagent.parse['application/json'])

    return res.body[0].LISTA
        .filter((item) => item.ISO == iso)
        .map(({IP, PORT}) => `http://${IP}:${PORT}`)
}
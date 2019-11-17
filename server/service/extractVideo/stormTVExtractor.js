const superagent = require('superagent')
const { getBestPlayerJSQuality } = require('../../utils')

module.exports = async (params, res) => {
    const { url } = params

    const siteRes = await superagent.get(url)
    const matches = siteRes.text.match(/file:"(.*)",/m)

    if(matches == null || matches.length < 1)
        throw Error('Video can`t be extracted')


    const videoUrl = getBestPlayerJSQuality(matches[1])

    res.redirect(videoUrl)
}
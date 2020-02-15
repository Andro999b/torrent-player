const superagent = require('superagent')
const CryptoJS = require('crypto-js')
const m3u8Extractor = require('./m3u8Extractor')
const directExtractor = require('./directExtractor')

const password = 'iso10126'

module.exports = async (params, res) => {
    const { url } = params

    if (url.indexOf('cdn.123moviesapp.net') != -1) {
        const siteRes = await superagent.get(url).timeout(5000)

        const { groups: { data } } = siteRes.text.match(/embedVal="(?<data>[^"]+)"/)

        const { videos } = JSON.parse(CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Utf8))

        for (const video of videos) {
            if (video.url.indexOf('fmoviesfree') != -1) {
                return m3u8Extractor(video, res)
            }
        }
    } else if(url.indexOf('fmoviesfree') != -1) {
        return m3u8Extractor(params, res)
    }

    return directExtractor(params, res)
}
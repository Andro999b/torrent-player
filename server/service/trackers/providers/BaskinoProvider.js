const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const { twoElemetsRowExtractor } = require('../../../utils/detailsExtractors')
const superagent = require('superagent')

class BaskinoProvider extends DataLifeProvider {
    constructor() {
        super('baskino', {
            scope: '.shortpost',
            selectors: {
                id: { selector: '.posttitle a', transform: ($el) => urlencode($el.attr('href')) },
                name: '.posttitle a'
            },
            detailsScope: '#dle-content',
            detailsSelectors: {
                title: '.title_social h1', 
                image: {
                    selector: '.mobile_cover img',
                    transform: ($el) => $el.attr('src')
                },
                description: {
                    selector: '.info table tr',
                    transform: twoElemetsRowExtractor
                },
                files: {
                    selector: 'iframe',
                    transform: async ($el) => {
                        const src = $el.attr('src')
                        const res = await superagent.get(src)

                        // let parts = res.text.match(/hlsList: (?<hls>{[^}]+}),/)
                        let parts = res.text.match(/franchise:\s+(?<franchise>\d+)/)
                        if(parts) {
                            const { groups: { franchise } } = parts
                            const { groups: { api } } = res.text.match(/apiBaseUrl:\s+"(?<api>.+)"/)
                            const { groups: { referer } } = res.text.match(/referer:\s+"(?<referer>.+)"/)

                            const seasonsRes = await superagent.get(api + `season/by-franchise/?id=${franchise}&host=${referer}`)
                            const seasons = JSON.parse(seasonsRes.text)

                            return (await Promise.all(seasons.map(async ({ id, season }) => {
                                const seasonsRes = await superagent.get(api + `video/by-season/?id=${id}&host=${referer}`)
                                const files = JSON.parse(seasonsRes.text)

                                return files.map((file, index) => ({
                                    id: file.id,
                                    manifestUrl: this._getBestQuality(file.urlQuality),
                                    path: `Season ${season}`,
                                    name: `Season ${season} / Episode ${index + 1}`,
                                }))
                            }))).flatMap((files) => files)
                        }

                        const { groups: { hls } } = res.text.match(/hlsList: (?<hls>{[^}]+}),/)

                        return [{
                            id: 1,
                            manifestUrl: this._getBestQuality(JSON.parse(hls)),
                        }]
                    }
                }
            }
        })
    }

    _getBestQuality(input) {
        return Object.keys(input)
            .map((key) => {
                return {
                    url: input[key],
                    quality: parseInt(key)
                }
            })
            .filter((it) => it)
            .sort((a, b) => a.quality - b.quality)
            .map((it) => it.url)
            .pop()
    }

    async _postProcessResultDetails(details) {
        if(details.files.length == 1) {
            details.files[0].name = details.title
        } 

        return details
    }
}

module.exports = BaskinoProvider
const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const { rowsLikeExtractor } = require('../../../utils/detailsExtractors')

class AnimeVostProvider extends DataLifeProvider {
    constructor() {
        super('animeVost', {
            scope: '.shortstory',
            pageSize: 50,
            selectors: {
                id: { selector: '.shortstoryHead a', transform: ($el) => urlencode($el.attr('href')) },
                name: '.shortstoryHead a'
            },
            detailsScope: '.shortstoryContent',
            detailsSelectors: {
                image: {
                    selector: '.imgRadius',
                    transform: ($el) => this.config.baseUrl + $el.attr('src')
                },
                description: {
                    selector: 'p',
                    transform: rowsLikeExtractor
                },
                files: {
                    selector: 'script',
                    transform: ($el) => {
                        const script = $el.toArray()[1].children[0].data
                        const matches = script.match(/var data = ([^;]+);/)

                        if(!matches) return []

                        const episodesDataStr = matches[1]

                        if(!episodesDataStr) return []

                        const episodesData = JSON.parse(episodesDataStr.replace(',}', '}'))

                        return Object.keys(episodesData)
                            .map((key, index) => {
                                const playerUrl = `http://play.aniland.org/${episodesData[key]}`
                                return {
                                    id: index,
                                    name: key,
                                    extractor: { type: 'animevost' },
                                    url: playerUrl
                                }
                            })
                    }
                }
            }
        })
    }
}

module.exports = AnimeVostProvider
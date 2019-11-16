const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const { rowsLikeExtractor } = require('../../../utils/detailsExtractors')

class AnimeVostProvider extends DataLifeProvider {
    constructor() {
        super('animeVost', {
            scope: '.shortstory',
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
                        let matches

                        for(const item of $el.toArray()) {
                            const script = item.children[0].data
                            matches = script.match(/var data = ([^;]+);/)

                            if(matches) break
                        }

                        if(!matches) return []

                        const episodesDataStr = matches[1]

                        if(!episodesDataStr) return []

                        const episodesData = JSON.parse(episodesDataStr.replace(',}', '}'))

                        return Object.keys(episodesData)
                            .map((key, index) => {
                                const playerUrl = `https://play.roomfish.ru/${episodesData[key]}`
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
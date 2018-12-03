const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const $ = require('cheerio')

class AnimeVostProvider extends DataLifeProvider {
    constructor() {
        super({
            baseUrl: 'http://animevost.org',
            searchUrl: 'http://animevost.org/index.php?do=search',
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
                    transform: ($el) => $el.attr('src') 
                },
                description: { 
                    selector: 'p',
                    transform: ($el) => {
                        return $el.toArray()
                            .map((node) => $(node).text())
                            .map((text) => {
                                const parts = text.split(':')
                                
                                if(parts.lenght < 2) return

                                const name = parts[0]
                                const value = parts.slice(1).join().trimLeft().replace(/\n+/, '')

                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    } 
                },
                files: {
                    selector: 'script',
                    transform: ($el) => {
                        const script = $el.toArray()[2].children[0].data
                        const matches = script.match(/var data = ([^;]+);/)

                        if(!matches) return []

                        const episodesDataStr = matches[1]

                        if(!episodesDataStr) return []

                        const episodesData = JSON.parse(episodesDataStr.replace(',}', '}'))

                        return Object.keys(episodesData)
                            .map((key, index) => {
                                const playerUrl = `http://play.aniland.org/${episodesData[key]}`
                                return {
                                    index,
                                    id: index,
                                    name: key,
                                    url: `/extractVideo?type=animevost&url=${urlencode(playerUrl)}`
                                }
                            })
                    }
                }
            }
        })
    }

    getName() {
        return 'animeVost'
    }
}

module.exports = AnimeVostProvider
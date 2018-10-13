const Provider = require('../Provider')
const urlencode = require('urlencode')
const $ = require('cheerio')

class FastTorrentsProvider extends Provider {
    constructor() {
        super({
            baseUrl: 'http://fast-torrent.ru',
            searchUrl: 'http://fast-torrent.ru/search/',
            scope: '.film-item',
            pageSize: 50,
            selectors: {
                id: {
                    selector: '.film-download',
                    transform: ($el) => urlencode($el.attr('href'))
                },
                name: 'h2'
            },
            detailsScope: '.film_page',
            detailsSelectors: {
                image: { 
                    selector: '.film-image a',
                    transform: ($el) => $el.attr('href')
                },
                torrents: {
                    selector: '.torrent-row',
                    transform: ($el) => $el
                        .map((i, node) => {
                            const { baseUrl } = this.config
                            const $node = $(node)
                            const isHd = $node.find('.c1 .qa-hd').length == 1
                            const episode = $node.find('.c9').text()
                            const trasnlation = $node.find('.c10').text()
                            const size = $node.find('.c3').text()
                            const name = 
                                `${isHd?'[HD] ':''}${episode}${trasnlation?', ' + trasnlation:''}${size?', ' + size:''}`
                            return {
                                type: 'torrent',
                                torrentUrl: baseUrl + $node.find('.download-event').attr('href'),
                                name
                            }
                        })
                        .toArray()
                },
                description: {
                    selector: '.info',
                    transform: ($el) => 
                        $el.find('>div>p')
                            .filter((i, node) => {
                                const $node = $(node)
                                return $node.has('>strong').length == 1 ||
                                    $node.is('[itemprop="description"]')
                            })
                            .map((i, node) => {
                                const $node = $(node)
                                const $strong = $node.find('strong')
                                if($strong.length == 1) {
                                    const name = $strong.text()
                                    const value = $node.text().substring(name.length + 1).trim()
                                    return { name, value }
                                } else {
                                    return { value: $node.text() }
                                }
                            })
                            .toArray()
                }
            }
        })
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return baseUrl + urlencode.decode(resultsId)
    }

    getSearchUrl(query) {
        const { searchUrl } = this.config
        return `${searchUrl}${query}/1.html`
    }

    getName() {
        return 'fastTorrent'
    }
}

module.exports = FastTorrentsProvider
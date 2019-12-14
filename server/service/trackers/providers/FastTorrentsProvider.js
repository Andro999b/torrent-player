const Provider = require('../Provider')
const urlencode = require('urlencode')
const requestFactory = require('../../../utils/requestFactory')
const $ = require('cheerio')

class FastTorrentsProvider extends Provider {
    constructor(subtype, categories) {
        super('fastTorrent', {
            subtype,
            categories,
            scope: '.film-item',
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
                    transform: ($el) => this._absoluteUrl($el.attr('href'))
                },
                torrents: {
                    selector: '.torrent-row',
                    transform: ($el) => $el
                        .map((i, node) => {
                            const { baseUrl } = this.config
                            const $node = $(node)
                            const hd = $node.find('.c1 .qa-hd').length == 1 && 'HD'
                            const episode = $node.find('.c9').text()
                            const trasnlation = $node.find('.c2,.c10').text()
                            const size = $node.find('.c3').text()
                            const name = [episode, trasnlation, size, hd].filter((it) => it).join(', ')
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

    getSearchUrl() {}

    _crawlerSearchRequestGenerator(query) {
        const { searchUrl, headers, categories, useProxy } = this.config

        return () => {
            return requestFactory({ proxy: useProxy })
                .post(`${searchUrl}${encodeURIComponent(query)}/1.html`)
                .type('form')
                .field({ 
                    type: categories
                })
                .buffer(true)
                .charset()
                .set(headers)
        }
    }
}

module.exports = FastTorrentsProvider
module.exports.providers = [
    new FastTorrentsProvider(
        'movies',
        [1]
    ),
    new FastTorrentsProvider(
        'tv-shows',
        [4, 14902]
    ),
    new FastTorrentsProvider(
        'cartoons',
        [14899]
    )
]
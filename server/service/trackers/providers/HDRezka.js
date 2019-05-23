const Provider = require('../Provider')
const urlencode = require('urlencode')
const $ = require('cheerio')

class HDRezka extends Provider {
    constructor() {
        super({
            baseUrl: 'http://hdrezka-ag.com/',
            searchUrl: 'http://hdrezka-ag.com/index.php?do=search&subaction=search',
            scope: '.b-content__inline_item',
            pageSize: 50,
            selectors: {
                id: {
                    selector: '.b-content__inline_item-link>a',
                    transform: ($el) => urlencode($el.attr('href'))
                },
                name: '.b-content__inline_item-link>a'
            },
            detailsScope: '.b-content__columns',
            detailsSelectors: {
                image: {
                    selector: '.b-sidecover img',
                    transform: ($el) => $el.attr('src')
                },
                description: {
                    selector: '.b-post__info tr',
                    transform: ($el) => {
                        return $el.toArray()
                            .map((tr) => {
                                const $td = $(tr).find('td')
                                const name = $td.eq(0).find('h2').text()
                                const value = $td.eq(1).text()
                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
                },
                files: {
                    transform: async ($scope) => {
                        let files = []
                        const $translations = $scope.find('.b-translators__list')
                        if($translations.length > 0) {
                            // files with translations
                            const t = $translations
                                .find('.b-translator__item')
                                .toArray()
                                .map((translation) => {
                                    const $translation = $(translation)
                                    const name = $translation.text()
                                    const url = $translation.attr('data-cdn_url')

                                    return Promise.resolve({
                                        name,
                                        hlsProxy: { type: 'streamguard' },
                                        hlsUrl: url
                                    })
                                })

                            files = (await Promise.all(t))
                                .reduce((acc, item) => acc.concat(item), [])
                        } else {
                            const $seasons = $scope.find('.b-simple_season__item')
                            const cdnPlayerUrl = $scope.find('#cdn-player').attr('src')
                            if($seasons.length > 0) {
                                // tv show with single translation
                                const seasonsCount = $seasons.length
                                const $episodesLists = $scope.find('.b-simple_episodes__list')

                                for(let s = 1; s <= seasonsCount; s++) {
                                    const episodesCount = $episodesLists.eq(s-1).children().length

                                    for(let e = 1; e <= episodesCount; e++) {
                                        const url = new URL(cdnPlayerUrl)
                                        url.searchParams.set('season', 1)
                                        url.searchParams.set('episode', 1)

                                        files.push({
                                            path: `Season ${s}`,
                                            name: `Season ${s} / Episode ${e}`,
                                            hlsProxy: { type: 'streamguard' },
                                            hlsUrl: url.toString()
                                        })
                                    }
                                }
                            } else {
                                // single file
                                const name = $scope.find('.b-post__title>h1').text()

                                files = [{
                                    name,
                                    hlsProxy: { type: 'streamguard' },
                                    hlsUrl: cdnPlayerUrl
                                }]
                            }
                        }
                        // $scope.find('.simple_seasons__list')
                        // $scope.find('.b-simple_episodes__list')
                        return files.map((item, index) => ({
                            id: index,
                            index,
                            ...item
                        }))
                    }
                }
            }
        })
    }

    getName() {
        return 'hdrezka'
    }

    getType() {
        return 'directMedia'
    }

    getSearchUrl(query) {
        return `${this.config.searchUrl}&q=${query}`
    }

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }
}

module.exports = HDRezka
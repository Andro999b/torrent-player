const { URL } = require('url')
const Provider = require('../Provider')
const { getBestPlayerJSQuality } = require('../../../utils')
const urlencode = require('urlencode')
const superagent = require('superagent')
const $ = require('cheerio')

class HDRezkaProvider extends Provider {
    constructor() {
        super({
            baseUrl: 'https://rezka.ag',
            searchUrl: 'https://rezka.ag/index.php?do=search&subaction=search',
            useProxy: true,
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
                    transform: ($el) => this.config.baseUrl + $el.attr('src')
                },
                description: {
                    selector: '.b-post__info tr',
                    transform: ($el) => {
                        return $el.toArray()
                            .map((tr) => {
                                const $td = $(tr).find('td')
                                const name = $td.eq(0).find('h2').text()
                                const value = $td.eq(1).text().trim()
                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
                },
                files: {
                    transform: async ($scope, $root) => {
                        let files = []
                        const $translations = $scope.find('.b-translators__list')
                        if ($translations.length > 0) {
                            files = await this._extractTranslationFiles($scope, $translations)
                        } else {
                            files = this._extractNoTranslationFiles($scope, $root)
                        }

                        return files.map((item, index) => ({
                            id: index,
                            ...item
                        }))
                    }
                }
            }
        })
    }

    async _extractTranslationFiles($scope, $translations) {
        const posterId = $scope.find('.b-simple_episode__item').first().attr('data-id')
        // files with translations
        const t = $translations
            .find('.b-translator__item')
            .toArray()
            .map(async (translation) => {
                const $translation = $(translation)
                const url = $translation.attr('data-cdn_url')

                if (url) {
                    const name = $translation.text()
                    return this._processCdnUrl(name, url)
                } else {
                    const title = $translation.attr('title')
                    const translatorId = $translation.attr('data-translator_id')

                    const res = await superagent
                        .post(`${this.config.baseUrl}/ajax/get_cdn_series/`)
                        .set(this.config.headers)
                        .type('form')
                        .send({ 'id': posterId, 'translator_id': translatorId })
                        .buffer(true)
                        .parse(superagent.parse['application/json'])

                    return this._processTranslationResponse(title, res)
                }
            })

        return (await Promise.all(t)).flatMap((it) => it)
    }

    getName() {
        return 'hdrezka'
    }

    getType() {
        return 'directMedia'
    }

    getSearchUrl(query) {
        // return `${this.config.searchUrl}&story=${urlencode(query, 'windows-1251')}`
        return `${this.config.searchUrl}&q=${encodeURIComponent(query)}`
    }

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }
}

class HDRezkaCDNProvider extends HDRezkaProvider {
    _processTranslationCdnUrl(name, url) {
        return [{ name, url: getBestPlayerJSQuality(url) }]
    }

    _processTranslationResponse(title, { body: { seasons, episodes } }) {
        const $seasons = $.load(seasons)('.b-simple_season__item')
        const $episodesLists = $.load(episodes)('.b-simple_episodes__list')

        return this
            ._extarctSeasonFiles($episodesLists, $seasons)
            .map((file) => ({
                ...file,
                path: [title, file.path].filter((i) => i).join(' / ')
            }))
    }

    _extractNoTranslationFiles($scope, $root) {
        const $seasons = $scope.find('.b-simple_season__item')

        if ($seasons.length > 0) {
            // tv show with single translation
            const $episodesLists = $scope.find('.b-simple_episodes__list')

            return this._extarctSeasonFiles($episodesLists, $seasons)
        } else {
            // single file

            const scripts = $root.find('script')
            const cdnInitScript = scripts[scripts.length - 3].children[0].data
            const parts = cdnInitScript.match(/"streams":"([^"]+)"/)

            if (parts && parts.length > 1) {
                const name = $scope.find('.b-post__title>h1').text()
                const urls = getBestPlayerJSQuality(parts[1])

                return [{
                    name,
                    url: urls.pop(),
                    alternativeUrls: urls
                }]
            }

            return []
        }
    }

    _extarctSeasonFiles($episodesLists, $seasons) {
        const seasonsCount = $seasons.length

        const files = []

        const createFile = ($el, e, s) => {
            const urls = getBestPlayerJSQuality($el.attr('data-cdn_url'))

            if (s != undefined) {
                return {
                    path: `Season ${s}`,
                    name: `Season ${s} / Episode ${e}`,
                    url: urls.pop(),
                    alternativeUrls: urls
                }
            } else {
                return {
                    name: `Episode ${e}`,
                    url: urls.pop(),
                    alternativeUrls: urls
                }
            }
        }

        if (seasonsCount == 1) {
            const episodes = $episodesLists.eq(0).children()

            episodes.each((i, el) =>
                files.push(createFile($(el), i + 1))
            )
        } else {
            for (let s = 0; s < seasonsCount; s++) {
                const episodes = $episodesLists.eq(s).children()
                episodes.each((i, el) =>
                    files.push(createFile($(el), i + 1, s + 1))
                )
            }
        }

        return files
    }
}

class HDRezkaStreamguardProvider extends HDRezkaProvider {

    _processTranslationCdnUrl(name, manifestUrl) {
        return [{ name, manifestUrl }]
    }

    _processTranslationResponse(title, { body: { seasons, episodes, player } }) {
        const $seasons = $.load(seasons)('.b-simple_season__item')
        const $episodesLists = $.load(episodes)('.b-simple_episodes__list')
        const cdnPlayerUrl = $.load(player)('iframe').attr('src')

        return this
            ._extarctSeasonFiles(cdnPlayerUrl, $episodesLists, $seasons)
            .map((file) => ({
                ...file,
                path: [title, file.path].filter((i) => i).join(' / ')
            }))
    }

    _extractNoTranslationFiles($scope) {
        const $seasons = $scope.find('.b-simple_season__item')
        const cdnPlayerUrl = $scope.find('iframe').attr('src')
        if ($seasons.length > 0) {
            // tv show with single translation
            const $episodesLists = $scope.find('.b-simple_episodes__list')

            return this._extarctSeasonFiles(cdnPlayerUrl, $episodesLists, $seasons)
        } else {
            // single file
            const name = $scope.find('.b-post__title>h1').text()

            return [{
                name,
                manifestUrl: cdnPlayerUrl
            }]
        }
    }

    _extarctSeasonFiles(cdnPlayerUrl, $episodesLists, $seasons) {
        const seasonsCount = $seasons.length

        const files = []

        const getEpisodeUrl = (s, e) => {
            const url = new URL(cdnPlayerUrl)
            url.searchParams.set('season', s)
            url.searchParams.set('episode', e)
            return url.toString()
        }

        if (seasonsCount == 1) {
            const episodesCount = $episodesLists.eq(0).children().length

            for (let e = 1; e <= episodesCount; e++) {
                files.push({
                    name: `Episode ${e}`,
                    manifestUrl: getEpisodeUrl(1, e)
                })
            }
        } else {
            for (let s = 1; s <= seasonsCount; s++) {
                const episodesCount = $episodesLists.eq(s - 1).children().length

                for (let e = 1; e <= episodesCount; e++) {
                    files.push({
                        path: `Season ${s}`,
                        name: `Season ${s} / Episode ${e}`,
                        manifestUrl: getEpisodeUrl(s, e)
                    })
                }
            }
        }

        return files
    }

    _postProcessResultDetails(details, resultsId) {
        details.files.forEach((file) => {
            const extractor = {
                type: 'streamguard',
                params: {
                    referer: resultsId
                }
            }

            file.extractor = extractor
            file.downloadUrl = '/videoStreamConcat?' + urlencode.stringify({
                manifestUrl: file.manifestUrl,
                extractor
            })
        })

        return details
    }
}

module.exports = HDRezkaCDNProvider
module.exports.provides = [HDRezkaStreamguardProvider, HDRezkaCDNProvider]
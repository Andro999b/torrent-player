const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const $ = require('cheerio')

class BaskinoProvider extends DataLifeProvider {
    constructor() {
        super({
            baseUrl: 'http://baskino.me/',
            searchUrl: 'http://baskino.me/index.php?do=search',
            useProxy: true,
            scope: '.shortpost',
            pageSize: 50,
            selectors: {
                id: {
                    selector: '.posttitle>a',
                    transform: ($el) => urlencode($el.attr('href'))
                },
                name: '.posttitle>a'
            },
            detailsScope: '.inside',
            detailsSelectors: {
                image: {
                    selector: '.mobile_cover img',
                    transform: ($el) => $el.attr('src')
                },
                description: {
                    selector: '.info tr',
                    transform: ($el) => {
                        return $el.toArray()
                            .map((tr) => {
                                const $td = $(tr).find('td')
                                let name = $td.eq(0).text().trim()
                                const value = $td.eq(1).text().trim()

                                name = name.substring(0, name.length - 1)

                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
                },
                files: {
                    transform: async ($scope) => {
                        return this._extractNoTranslationFiles($scope)
                            .map((item, index) => ({
                                id: index,
                                ...item
                            }))
                    }
                }
            }
        })
    }

    _extractNoTranslationFiles($scope) {
        const $seasons = $scope.find('.tvs_slides_seasons')
        const cdnPlayerUrl = this._extractPLayerUrl($scope)

        if(!cdnPlayerUrl) return []

        if($seasons.length > 0) {
            // tv show with single translation
            const $episodesLists = $scope.find('.tvs_slides_episodes')

            return this._extarctSeasonFiles(cdnPlayerUrl, $episodesLists, $seasons)
        } else {
            // single file
            const name = $scope.find('.title_social h1')
                .text()
                .replace(/\n/g, '')
                .trim()

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
            url.searchParams.set('season', 1)
            url.searchParams.set('episode', e)
            return url.toString()
        }

        if(seasonsCount == 1) {
            const episodesCount = this._extractEpisodesCount($episodesLists.eq(0))

            for(let e = 1; e <= episodesCount; e++) {
                files.push({
                    name: `Episode ${e}`,
                    manifestUrl: getEpisodeUrl(1, e)
                })
            }
        } else {
            for(let s = 1; s <= seasonsCount; s++) {
                const episodesCount = this._extractEpisodesCount($episodesLists.eq(s - 1))

                for(let e = 1; e <= episodesCount; e++) {
                    files.push({
                        path: `Season ${s}`,
                        name: `Season ${s} / Episode ${e}`,
                        manifestUrl: getEpisodeUrl(1, e)
                    })
                }
            }
        }

        return files
    }

    _extractEpisodesCount($episode) {
        return parseInt(
            $episode
                .find('span')
                .text()
                .split('\\s')[0]
        )

    }

    _extractPLayerUrl($scope) {
        const iframeSrc = $scope.find('#basplayer_hd iframe').attr('src')

        if(iframeSrc) return iframeSrc

        const script = $scope.find('.inner>script').toArray()[0].children[0].data

        const matches = script.match(/src=\\"([^;]+)\\"\swidth/)
        if(!matches) return null

        const encodedUrl = matches[1]
        if(!encodedUrl) return null

        return encodedUrl.replace(/\\/g, '')
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

    getName() {
        return 'baskino'
    }
}

module.exports = BaskinoProvider
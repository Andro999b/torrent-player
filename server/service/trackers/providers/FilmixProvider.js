const DirectMediaProvider = require('./DirectMediaProvider')
const urlencode = require('urlencode')
const superagent = require('superagent')
const requestFactory = require('../../../utils/requestFactory')
const {
    convertPlayerJSPlaylist,
    getBestPlayerJSQuality
} = require('../../../utils')

class FilmixProvider extends DirectMediaProvider {
    constructor() {
        super('filmix', {
            scope: '.shortstory.line',
            selectors: {
                id: { selector: '.name a', transform: ($el) => urlencode($el.attr('href')) },
                name: '.name a'
            },
            detailsScope: '#dle-content',
            detailsSelectors: {
                title: '.name',
                description: '.full-story',
                image: {
                    selector: '.poster',
                    transform: ($el) => $el.attr('src')
                },
                files: {
                    selector: '.players',
                    transform: async ($el) => {
                        const postId = $el.attr('data-player')

                        const res = await this.agent
                            .post(`${this.config.baseUrl}/api/movies/player_data`)
                            .type('form')
                            .field({
                                'post_id': postId,
                                'showfull': true
                            })
                            .timeout(this.config.timeout)
                            .set(this.config.headers)
                            .set('X-Requested-With', 'XMLHttpRequest')
                            .parse(superagent.parse['application/json'])

                        const encryptedTranslations = res.body
                            .message
                            .translations
                            .video

                        const translations = Object.keys(encryptedTranslations)
                            .map((translation) => ({
                                translation,
                                url: this._decrypt(encryptedTranslations[translation])
                            }))

                        const translationsFiles = await Promise.all(translations
                            .map(({ translation, url }) =>
                                this._translationToFiles(translation, url)
                            ))

                        return translationsFiles
                            .flatMap((it) => it)
                            .map((file, index) => ({ ...file, id: index }))

                    }
                }
            }
        })

        this.agent = requestFactory({
            proxy: this.config.useProxy
        })
    }

    getSearchUrl(q) {
        const { searchUrl } = this.config
        return `${searchUrl}/${encodeURIComponent(q)}`
    }

    async _translationToFiles(translation, url) {
        if (url.endsWith('txt')) {
            const res = await this.agent
                .get(url)
                .buffer(true)
                .parse(superagent.parse.text)
            
            const playlist = JSON.parse(this._decrypt(res.text))

            return convertPlayerJSPlaylist(playlist).map((file) => ({
                ...file,
                name: `${translation} ${file.name}`,
                path: `${translation} ${file.path}`
            }))
        } else {
            const urls = getBestPlayerJSQuality(url)
            return [{
                name: translation,
                url: urls.pop(),
                alternativeUrls: urls
            }]
        }
    }

    _decrypt(x) {
        const v = {
            'bk0': '2owKDUoGzsuLNEyhNx',
            'bk1': '19n1iKBr89ubskS5zT',
            'bk2': 'IDaBt08C9Wf7lYr0eH',
            'bk3': 'lNjI9V5U1gMnsxt4Qr',
            'bk4': 'o9wPt0ii42GWeS7L7A',
            'file3_separator': ':<:'
        }

        let a = x.substr(2)

        function b1(str) {
            const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1)
                })

            return Buffer.from(binary, 'binary').toString('base64')
        }

        function b2(str) {
            const encodedUrl = Buffer.from(str, 'base64').toString('binary').split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join('')
            return decodeURIComponent(encodedUrl)
        }

        for (var i = 4; i > -1; i--) {
            if (v['bk' + i] != undefined) {
                if (v['bk' + i] != '') {
                    a = a.replace(v.file3_separator + b1(v['bk' + i]), '')
                }
            }
        }

        return b2(a)
    }

    async _postProcessResultDetails(details) {
        details.files = details.files || []
        if (details.files.length == 1) {
            details.files[0].name = details.title
        }

        return details
    }

    _crawlerInfoRequestGenerator(resultId) {
        return () => this._requestGenerator(this.getInfoUrl(resultId))
    }

    _crawlerSearchRequestGenerator(query) {
        return async () => {
            await this.agent.get(this.getSearchUrl(query))

            return this.agent
                .post(`${this.config.baseUrl}/engine/ajax/sphinx_search.php`)
                .type('form')
                .field({
                    'scf': 'fx',
                    'story': query,
                    'do': 'search',
                    'subaction': 'search'
                })
                .buffer(true)
                .charset()
                .timeout(this.config.timeout)
                .set(this.config.headers)
                .set('X-Requested-With', 'XMLHttpRequest')
        }
    }

    _requestGenerator(url) {
        const request = this.agent
            .get(url)
            .buffer(true)
            .charset()
            .timeout(this.config.timeout)
            .set(this.config.headers)

        return request
    }
}

module.exports = FilmixProvider
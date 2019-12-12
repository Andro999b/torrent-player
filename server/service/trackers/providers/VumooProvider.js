const DirectMediaProvider = require('./DirectMediaProvider')
const urlencode = require('urlencode')
const superagent = require('superagent')
const $ = require('cheerio')

class VumooPlayer extends DirectMediaProvider {
    constructor() {
        super('vumoo', {
            detailsScope: 'body',
            detailsSelectors: {
                title: '.film-box>h1',
                image: {
                    selector: '.poster',
                    transform: ($el) => $el.attr('src')
                },
                description: '.film-box>span',
                files: {
                    selector: '#server-1',
                    transform: async ($el) => {
                        return $el
                            .find('.episodes a')
                            .toArray()
                            .map((a, id) => {
                                const $a = $(a)
                                return {
                                    id,
                                    name: $a.text(),
                                    manifestUrl: $a.attr('embedurl'),
                                    extractor: { type: '123moviesapp' }
                                }
                            })
                    } 
                }
            }
        })
    }

    async search(query) {
        const { searchUrl } = this.config

        const res = await superagent
            .get(`${searchUrl}&q=${encodeURIComponent(query)}`)

        return JSON.parse(res.text)
            .suggestions
            .map(({ value, data: { href } }) => ({
                name: value,
                id: urlencode(href),
                provider: this.name
            }))

    }
}

module.exports = VumooPlayer
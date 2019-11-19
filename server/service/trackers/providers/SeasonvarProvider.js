const DirectMediaProvider = require('./DirectMediaProvider')
const urlencode = require('urlencode')

// const superagent = require('superagent')

class SeasonvarProvider extends DirectMediaProvider {
    constructor() {
        super('seasonvar', {
            scope: '.pgs-search-wrap',
            selectors: {
                id: { selector: '.pgs-search-info a:first-child', transform: ($el) => urlencode($el.attr('href')) },
                name: '.pgs-search-info a:first-child'
            },
            detailsScope: '.middle',
            detailsSelectors: {
                title: '.pgs-sinfo-title',
                description: '.pgs-sinfo-info p:first-child', 
                image: {
                    selector: '.poster img',
                    transform: ($el) => $el.attr('src')
                },
                files: {
                    transform: async ($el) => {
                        const serialId = $el.find('.pgs-sinfo').attr('data-id-serial')

                        let matches
                        $el.find('script').each((_, elem) => {
                            const script = elem.children[0]
                            
                            if(script) {
                                matches = script.data.match(/var data4play = (\{[^}]*\})/gs)
                                if(matches) return false
                            }
                        })

                        if(!matches) return []
                        const data4play = JSON.parse(matches[1])

                        return {
                            serialId,
                            data4play
                        }
                    }
                }
            }
        })
    }

    getSearchUrl(q) {
        const { searchUrl } = this.config
        return `${searchUrl}?q=${encodeURIComponent(q)}`
    }
}

module.exports = SeasonvarProvider
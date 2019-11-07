const DataLifeProvider = require('./DataLIfeProvider')
const superagent = require('superagent')
const urlencode = require('urlencode')
const $ = require('cheerio')
const { rowsLikeExtractor } = require('../../../utils/detailsExtractors')

const idExractor = /https:\/\/kinokrad\.co\/([0-9]+)/

class KinokradProvider extends DataLifeProvider {
    constructor() {
        super({
            baseUrl: 'https://kinokrad.co/',
            searchUrl: 'https://kinokrad.co//index.php?do=search',
            scope: '.searchitem',
            pageSize: 50,
            selectors: {
                id: { selector: '.searchitem>h3>a', transform: ($el) => urlencode($el.attr('href')) },
                name: '.searchitem>h3>a'
            },
            detailsScope: '#dle-content',
            detailsSelectors: {
                title: '.fallsttitle>h1',
                image: { 
                    selector: '.bigposter>img', 
                    transform: ($el) => $el.attr('src') 
                },
                description: { 
                    selector: '.janrfall>li',
                    transform: rowsLikeExtractor
                },
                files: {
                    selector: '.boxfilm script',
                    transform: ($el) => {
                        const script = $el.toArray()[0].children[0].data
                        const matches = script.match(/var filmSource = "([^]+)" \|\|/)

                        if(!matches) return []

                        const manifestUrl = matches[1]
                        const extractor = { type: 'direct' }

                        return [{
                            id: 0, 
                            extractor,
                            downloadUrl: '/videoStreamConcat?' + urlencode.stringify({
                                manifestUrl,
                                extractor
                            }),
                            manifestUrl
                        }]
                    }
                }
            }
        })
    }

    async _postProcessResultDetails(details, resultsId) {
        if(details.files.length == 0) {
            const id = resultsId.match(idExractor)[1]
            const res = await superagent.get(`${this.config.baseUrl}playlist/${id}.txt`)

            const { playlist } = JSON.parse(res.text)

            details.files = playlist
                .map(({comment, file}, index) => ({
                    id: index,
                    name: comment,
                    extractor: { type: 'direct' },
                    manifestUrl: file
                }))
        } else {
            details.files[0].name = details.title
        }

        return details
    }

    getName() {
        return 'kinokrad'
    }
}

module.exports = KinokradProvider
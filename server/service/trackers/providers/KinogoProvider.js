const DataLifeProvider = require('./DataLIfeProvider')
const { getBestPlayerJSQuality } = require('../../../utils')
const urlencode = require('urlencode')

class KinogoProvider extends DataLifeProvider {
    constructor() {
        super({
            baseUrl: 'https://kinogo.by',
            searchUrl: 'https://kinogo.by/index.php?do=search',
            pageSize: 100,
            scope: 'div.shortstory',
            selectors: {
                id: {
                    selector: '.zagolovki>a:nth-last-child(1)', 
                    transform: ($el) => urlencode($el.attr('href'))
                },
                name: '.zagolovki>a:nth-last-child(1)'
            },
            pagenatorSelector: '',
            detailsScope: '#dle-content',
            detailsSelectors: {
                title: '.shortstorytitle>h1',
                image: {
                    selector: '.fullimg>div>a>img',
                    transform: ($el) => this.config.baseUrl + $el.attr('src')
                },
                description: {
                    selector: '.quote',
                    transform: ($el) => {
                        return $el.text().split('\n')
                            .map((line) => {
                                const parts = line.split(':')
                                let name = parts[0] && parts[0].trim()
                                const value = parts[1] && parts[1].trim()

                                name = name.substring(0, name.length - 1)

                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
                },
                files: {
                    selector: '#1212',
                    transform: ($el) => {
                        const script = $el.next().toArray()[0].children[0].data

                        var files = this._tryExtractMp4(script)

                        if(!files) {
                            files = this._tryExtractHls(script)
                        }

                        if(!files) {
                            files = this._tryExtractFiles(script)
                        }

                        files = files || []

                        return files.map((item, index) => ({
                            id: index,
                            ...item
                        }))
                    }
                }
            }
        })
    }

    _tryExtractHls(script) {
        const parts = script.match(/fhls = "([^"]+)"/)

        if(parts && parts.length > 1) {
            const manifestUrl = this._extractManifest(parts[1])

            return [{ 
                manifestUrl, 
                downloadUrl: '/videoStreamConcat?' + urlencode.stringify({ manifestUrl}) 
            }]
        }
    }

    _tryExtractMp4(script) {
        const parts = script.match(/fmp4 = "([^"]+)"/)

        if(parts && parts.length > 1) {
            const urls = getBestPlayerJSQuality(parts[1])
            return [{ 
                url: urls.unshift(), 
                alternativeUrls: urls 
            }]
        }
    }

    _tryExtractFiles(script) {
        const parts = script.match(/"file" : (\[.*\]),/)

        if(parts) {
            return JSON.parse(parts[1])
                .map((it, season) => {
                    if(it.file) {
                        const urls = getBestPlayerJSQuality(it.file)
                        return [{
                            name: `Episode ${season + 1}`,
                            url: urls.pop(), 
                            alternativeUrls: urls 
                        }]
                    } else {
                        return it.folder.map(({ file } , episode) => {
                            const urls = getBestPlayerJSQuality(file)
                            return {
                                path: `Season ${season + 1}`,
                                name: `Season ${season + 1} / Episode ${episode + 1}`,
                                url: urls.pop(), 
                                alternativeUrls: urls 
                            }
                        })
                    }
                })
                .flatMap((it) => it)
        }
    }

    async _postProcessResultDetails(details) {
        if(details.files.length == 1) {
            details.files[0].name = details.title
        } 

        return details
    }

    getName() {
        return 'kinogo'
    }

    _getSiteEncoding() {
        return 'windows-1251'
    }
}

module.exports = KinogoProvider
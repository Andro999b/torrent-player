const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const $ = require('cheerio')

class AnidubProvider extends DataLifeProvider {
    constructor() {
        super({
            baseUrl: 'https://anime.anidub.com',
            searchUrl: 'https://anime.anidub.com/index.php?do=search',
            scope: '.newstitle',
            pageSize: 50,
            selectors: {
                id: { selector: '.title>a', transform: ($el) => urlencode($el.attr('href')) },
                name: '.title>a'
            },
            detailsScope: '#dle-content',
            detailsSelectors: {
                image: {
                    selector: '.poster_img>img',
                    transform: ($el) => $el.attr('src')
                },
                description: {
                    selector: '.maincont>ul>li',
                    transform: ($el) => {
                        return $el.toArray()
                            .map((node) => $(node).text())
                            .map((text) => {
                                const parts = text.split(':')

                                if(parts.lenght < 2) return

                                const name = parts[0]
                                const value = parts.slice(1).join().trimLeft().replace(/\n+/, '')

                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
                },
                files: {
                    selector: '.players',
                    transform: ($players) => {
                        let $player = $players.find('#our1, .active').first()
                        if($player.lenght == 0) {
                            $player = $players.first()
                        }
                        return this.extractPlayerFiles($player.find('select>option'))
                    }  
                }
            }
        })
    }

    extractPlayerFiles($playerOptions) {
        return $playerOptions.toArray()
            .map((node) => {
                const $node = $(node)
                const playerUrl = $node.attr('value').split('|')[0]

                const file = {
                    name: $node.text()
                }

                if(playerUrl.indexOf('sibnet') != -1) {
                    return null
                } else if (playerUrl.indexOf('storm') != -1) {
                    file.extractor = { type: 'stormTv' }
                    file.url = playerUrl
                } else {
                    const extractor = {
                        type: 'anidub',
                        params: {
                            referer: urlencode(playerUrl)
                        }
                    }
                    file.manifestUrl = playerUrl
                    // Encrypted semnets :(
                    // file.downloadUrl = '/videoStreamConcat?' + urlencode.stringify({
                    //     manifestUrl: playerUrl,
                    //     extractor
                    // })
                    file.extractor = extractor
                }

                return file
            })
            .filter((file) => file)
            .map((file, index) => ({
                id: index,
                ...file
            }))
    }

    getName() {
        return 'anidub'
    }
}

module.exports = AnidubProvider
const DataLifeProvider = require('./DataLIfeProvider')
const urlencode = require('urlencode')
const $ = require('cheerio')
const { rowsLikeExtractor } = require('../../../utils/detailsExtractors')

class AnidubProvider extends DataLifeProvider {
    constructor() {
        super('anidub', {
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
                    transform: rowsLikeExtractor
                },
                files: {
                    selector: '.players',
                    transform: ($players) => {
                        // looks like anidub player broken
                        // let $player = $players.find('#our1, .active').first()
                        // if($player.lenght == 0) {
                        //     $player = $players.first()
                        // }
                        const $player = $players.first() // use first one
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
                } else if(playerUrl.indexOf('rutube') != -1) {
                    return null
                } else {
                    const extractor = {
                        type: 'anidub',
                        params: {
                            referer: urlencode(playerUrl)
                        }
                    }
                    file.manifestUrl = playerUrl
                    // Encrypted seпmeтts :(
                    // file.downloadUrl = '/videoStreamConcat?' + urlencode.stringify({
                    //     manifestUrl: playerUrl,
                    //     extractor
                    // })
                    file.extractor = extractor
                }

                console.log(file);

                return file
            })
            .filter((file) => file)
            .map((file, index) => ({
                id: index,
                ...file
            }))
    }
}

module.exports = AnidubProvider
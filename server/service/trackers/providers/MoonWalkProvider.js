const fs = require('fs-extra')
const path = require('path')
const superagent = require('superagent')
const urlencode = require('urlencode')
const { ROOT_DIR } = require('../../../config')

// api token
// 6eb82f15e2d7c6cbb2fdcebd05a197a2
// 858facbc8b7d9061761e8540f46a2b3b
// 29b413aaa453a43fb4a91d81648aca5c

let apiToken
try{
    const buf = fs.readFileSync(path.join(ROOT_DIR, 'moonwalk-token'))
    apiToken = buf.toString('utf-8')
} catch(err) {
    apiToken = '6eb82f15e2d7c6cbb2fdcebd05a197a2'
}

console.log(`Moonwalk token: ${apiToken}`) // eslint-disable-line no-console

class MoonWalkProvider {

    search(query) {
        return superagent
            .get(`http://moonwalk.cc/api/videos.json?api_token=${apiToken}&title=${encodeURIComponent(query)}`)
            .then(({ body }) => 
                body.map((item) => {
                    const name = item.translator ? `${item.title_en} - ${item.translator}` : item.title_en
                    const files = []

                    if(item.season_episodes_count) {
                        item.season_episodes_count.forEach(({ episodes }, seasonIndex) => {
                            episodes.forEach((_, episodeIndex) => { // eslint-disable-line no-unused-vars
                                files.push(this.createFile(
                                    `${item.iframe_url}?season=${seasonIndex}&episode=${episodeIndex}`, 
                                    `Episode ${episodeIndex + 1}`,
                                    `Season ${seasonIndex + 1} / Episode ${episodeIndex + 1}`
                                ))
                            })
                        })
                    } else {
                        files.push(this.createFile(item.iframe_url, name))
                    }

                    return  {
                        id: item.token,
                        name,
                        provider: this.getName(),
                        details: {
                            description: [
                                {
                                    name: 'Year',
                                    value: item.material_data.year
                                },
                                {
                                    name: 'Description',
                                    value: item.material_data.description
                                },
                                {
                                    name: 'Countries',
                                    value: item.material_data.countries.join(', ')
                                },
                                {
                                    name: 'Genre',
                                    value: item.material_data.genres.join(', ')
                                },
                                {
                                    name: 'Actors',
                                    value: item.material_data.actors.join(', ')
                                },
                                {
                                    name: 'Directors',
                                    value: item.material_data.directors.join(', ')
                                },
                                {
                                    name: 'Kinopoisk Rating',
                                    value: item.material_data.kinopoisk_rating
                                },
                                {
                                    name: 'IMDB Rating',
                                    value: item.material_data.imdb_rating
                                },
                            ],
                            image: item.material_data.poster,
                            files,
                            type: 'directMedia'
                        }
                    }
                })
            )
    }

    createFile(manifestUrl, name, path) {
        const extractor = { 
            type: 'streamguard',
            params: {
                referer: 'http://moonwalk.cc/'
            }
        }
        const downloadUrl = '/videoStreamConcat?' + urlencode.stringify({
            manifestUrl,
            extractor
        })

        const file = {
            name,
            manifestUrl,
            extractor,
            downloadUrl
        }

        file.path = path

        return file
    }

    getInfo() {}

    getName() {
        return 'moonwalk'
    }
}

module.exports = MoonWalkProvider
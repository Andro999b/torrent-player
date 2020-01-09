const defaultArgc = {
    'dlna': true,
    'dlna-renderers': true,
    'transcoding': true,
    'torrents-providers': true
}

const uuid = require('uuid')
const ip = require('ip')
const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2), { default: defaultArgc })
const firstExistPath = require('./utils/firstExistPath')

const ROOT_DIR = argv['root-dir'] || path.join(os.homedir(), 'webtorrents')
const CLIENT_DIR = firstExistPath([
    path.join(__dirname, 'client'),
    path.join(__dirname, 'client', 'dist'),
    path.join(__dirname, '..', 'client', 'dist'),
    path.join(__dirname, '..', 'client')
])

const RESOURCES_DIR = firstExistPath([
    path.join(__dirname, 'resources'),
    path.join(__dirname, '..', 'resources'),
])

const TOOLS_DIR = !argv['system-ffmpeg'] && firstExistPath([
    path.join(__dirname, 'tools'),
    path.join(__dirname, '..', 'tools'),
])

/* eslint-disable */
console.log('Arguments', argv)
console.log('Config root directory: ', ROOT_DIR)
console.log('Resources directory: ', RESOURCES_DIR)
console.log('UI directory: ', CLIENT_DIR)
console.log('Tools root directory: ', TOOLS_DIR)
/* eslint-enable */

const prpvodersSettings = argv['providres']
let providresConfig = fs.readJsonSync(path.join(RESOURCES_DIR,  'providers.json'))

try{
    if(prpvodersSettings) {
        providresConfig = Object.assign(prpvodersSettings, fs.readJSONSync(path.join(RESOURCES_DIR,  prpvodersSettings + '.json')))
    }
} catch(e) {
    console.error(`Fail to load custom provider settings ${prpvodersSettings}`, providresConfig)
}


module.exports = {
    CLIENT_DIR,
    RESOURCES_DIR,
    TOOLS_DIR,
    HOSTNAME: argv['hostname'] || ip.address(),
    DLNA_UUID: argv['dlna-uid'] || uuid(),
    DLNA_NAME: argv['dlna-name'] || 'Torrents',
    DLNA_PORT: argv['dlna-port'] || 5004,
    WEB_PORT: argv['web-port'] || 8080,
    INTERNAL_WEB_PORT: argv['internal-web-port'] || argv['web-port'] || 8080, 
    TRANSCODER_IDLE_TIMEOUT: 60 * 1000,
    HLS_FRAGMENT_DURATION: 10,
    /*
        timeout 2 times longer that time needted to play 1 fragment.
        if during this time client not request any fragment we can pause transcoding
    */
    HLS_TRANSCODER_IDLE_TIMEOUT: 10 * 1000 * 2,
    ROOT_DIR,
    HLS_DIRECTORY: path.join(ROOT_DIR, 'hls'),
    TORRENTS_DIR: path.join(ROOT_DIR, 'torrents'),
    TORRENTS_DATA_DIR: path.join(ROOT_DIR, 'data'),
    TRANSCODING_ENABLED: argv['transcoding'],
    DLNA_ENABLED: argv['dlna'],
    DLNA_RENDERERS_ENABLED: argv['dlna-renderers'],
    PROXY_HEADERS: ['Content-Type', 'Content-Length', 'Cache-Control', 'ETag', 'Expires', 'Date', 'Last-Modified'],
    // configuration for client
    CLIENT_CONFIG: {
        'torrentsProviders': argv['torrents-providers'],
        'transcoding': argv['transcoding']
    },
    USE_PROXY: argv['proxy'],
    USE_PROXY_REGION: argv['proxy-region'],
    PROXY_CHECK_URL: argv['proxy-check-url'] || 'https://google.com',
    PROXY_CHECK_TIMEOUT: argv['proxy-timeout'] || 5000,
    PROVIDERS_CONFIG: providresConfig
}
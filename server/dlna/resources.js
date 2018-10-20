const mime = require('mime-types')
const ip = require('ip')
const database = require('../service/torrents/database')
const { isVideo, isAudio, isPsSupported, formatDLNADuration } = require('../utils')
const { WEB_PORT } = require('../config')

function getItemClass(fsEntry) {
    if (isVideo(fsEntry.title))
        return 'object.item.videoItem'
    if (isAudio(fsEntry.title))
        return 'object.item.audioItem'
    return 'object.item'
}

function commonResource({ infoHash, upnpClass, fsEntry }) {
    const { title, fileIndex, file, id, parentId } = fsEntry

    return {
        _name: 'item',
        _attrs: {
            id: `${id}`,
            parentID: `${parentId}`,
            restricted: '1'
        },
        _content: [
            { 'dc:title': title },
            { 'upnp:class': upnpClass },
            {
                _name: 'res',
                _attrs: {
                    'protocolInfo': `http-get:*:${mime.lookup(title)}:*`,
                    'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                    'size': file.length
                },
                _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}`
            }
        ]
    }
}

async function videoResource({ infoHash, upnpClass, fsEntry, clientId }) {
    const { title, fileIndex, parentId, id, file } = fsEntry

    const content = [
        { 'dc:title': title },
        { 'upnp:class': upnpClass }
    ]

    let formatedDuration = null
    const metadata = database.getTorrentFileMetadata(infoHash, file.path)
    if(metadata) {
        formatedDuration = formatDLNADuration(metadata.duration)
    }

    if(clientId != 'ps' && isPsSupported(title)) {
        content.push({
            _name: 'res',
            _attrs: {
                'protocolInfo': `http-get:*:${mime.lookup(title)}`,
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'size': -1,
                'duration': formatedDuration
            },
            _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}`
        })
    }

    content.push({
        _name: 'res',
        _attrs: {
            'protocolInfo': 'http-get:*:video/mpegts:DLNA.ORG_PN=MPEG_TS_SD_EU_ISO;DLNA.ORG_OP=10',
            'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
            'size': -1,
            'duration': formatedDuration
        },
        _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}/transcoded?clientId=${clientId}`
    })

    return {
        _name: 'item',
        _attrs: {
            id: `${id}`,
            parentID: `${parentId}`,
            restricted: '1'
        },
        _content: content
    }
}


async function getMediaResource(params) {
    const upnpClass = getItemClass(params.fsEntry)
    switch (upnpClass) {
        case 'object.item.videoItem':
            return videoResource({...params, upnpClass})
        case 'object.item.audioItem':
        default:
            return commonResource({...params, upnpClass})
    }
}

module.exports = getMediaResource
const uuid = require('uuid')
const mime = require('mime-types')
const ip = require('ip')
const metadataService = require('../service/metadata')
const { isVideo, isAudio, formatDLNADuration } = require('../utils')
const { WEB_PORT } = require('../config')

function getItemClass(item) {
    if (isVideo(item.path))
        return 'object.item.videoItem'
    if (isAudio(item.path))
        return 'object.item.audioItem'
    return 'object.item'
}

function commonResource(infoHash, id, upnpClass, file) {
    const { title, path } = file

    return Promise.resolve({
        _name: 'item',
        _attrs: {
            id: `${infoHash}:${id}`,
            parentID: `${infoHash}`,
            restricted: '1'
        },
        _content: [
            { 'dc:title': title },
            { 'upnp:class': upnpClass },
            {
                _name: 'res',
                _attrs: {
                    'protocolInfo': `http-get:*:${mime.lookup(path)}:*`,
                    'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                    'size': file.length
                },
                _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${id}`
            }
        ]
    })
}

function videoResource(infoHash, id, upnpClass, file) {
    const { name, path } = file

    return metadataService.getMetdadata(file).then((metadata) => {
        const { format: { size, duration } } = metadata
        const formatedDuration = formatDLNADuration(duration)

        return {
            _name: 'item',
            _attrs: {
                id: `${infoHash}:${id}`,
                parentID: `${infoHash}`,
                restricted: '1'
            },
            _content: [
                { 'dc:title': name },
                { 'upnp:class': upnpClass },
                {
                    _name: 'res',
                    _attrs: {
                        'protocolInfo': `http-get:*:${mime.lookup(path)}`,
                        'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                        size,
                        'duration': formatedDuration
                    },
                    _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${id}`
                },
                {
                    _name: 'res',
                    _attrs: {
                        'protocolInfo': 'http-get:*:video/mpegts:DLNA.ORG_PN=MPEG_TS_SD_EU_ISO;DLNA.ORG_OP=10',
                        'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                        'size': -1,
                        'duration': formatedDuration
                    },
                    _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${id}/transcoded?clientId=${uuid()}`
                }
            ]
        }
    })
}


function getMediaResource(infoHash, fileIndex, file) {
    const upnpClass = getItemClass(file)
    switch (upnpClass) {
        case 'object.item.videoItem':
            return videoResource(infoHash, fileIndex, upnpClass, file)
        case 'object.item.audioItem':
        default:
            return commonResource(infoHash, fileIndex, upnpClass, file)
    }
}

module.exports = getMediaResource
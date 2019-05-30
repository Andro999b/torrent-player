const mime = require('mime-types')
const ip = require('ip')
const database = require('../service/torrents/database')
const metadataService = require('../service/metadata')
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

async function videoResource({ id, parentId, upnpClass, fsEntry, clientId }) {
    const { title, fileIndex } = fsEntry
    const { type, infoHash } = parseObjetcId(parentId)

    const content = [
        { 'dc:title': title },
        { 'upnp:class': upnpClass }
    ]

    if(type == 'transcode') {
        content.push({
            _name: 'res',
            _attrs: {
                'protocolInfo': 'http-get:*:video/mpegts:DLNA.ORG_PN=MPEG_TS_HD_EU_ISO;DLNA.ORG_OP=10',
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'size': -1,
                // 'duration': formatedDuration
            },
            _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}/transcoded?clientId=${clientId}`
        })
    } else {
        content.push({
            _name: 'res',
            _attrs: {
                'protocolInfo': `http-get:*:${mime.lookup(title)}:*`,
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'size': -1
            },
            _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}`
        })
    }

    return {
        _name: 'item',
        _attrs: {
            id,
            parentID: parentId,
            restricted: '1'
        },
        _content: content
    }
}


async function mediaResource(params) {
    const upnpClass = getItemClass(params.fsEntry)
    switch (upnpClass) {
        case 'object.item.videoItem':
            return videoResource({...params, upnpClass})
        case 'object.item.audioItem':
        default:
            return commonResource({...params, upnpClass})
    }
}

function containerResource({ id, parentId = '0', count = 1, title }) {
    return {
        _name: 'container',
        _attrs: {
            id,
            parentID: `${parentId}`,
            childCount: `${count}`,
            restricted: '1'
        },
        _content: {
            'dc:title': title,
            'upnp:class': 'object.container.storageFolder'
        }
    }
}


function parseObjetcId(resId) {
    const parts = resId.split(':')

    return {
        type: parts[0],
        infoHash: parts[1],
        torrentFsId: parts[2] || 0
    }
}

function createObjetcId({ type, infoHash, torrentFsId }) {
    return [ type, infoHash, torrentFsId ].filter((i) => i).join(':')
}

module.exports = { mediaResource, containerResource, parseObjetcId, createObjetcId }
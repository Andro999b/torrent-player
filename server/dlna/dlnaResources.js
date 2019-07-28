const mime = require('mime-types')
const { isVideo, isAudio, formatDLNADuration } = require('../utils')
const { WEB_PORT, HOSTNAME } = require('../config')
const { DLNA_ORIGIN_FLAGS } = require('./dlnaFlags')
const metadataService = require('../service/metadata')
const torrentsDatabase = require('../service/torrents/database')
const checkIfTorrentFileReady = require('../service/torrents/checkIfTorrentFileReady')
const tanscoderSettings = require('../service/transcode/settings')
const dlnaProfileName = require('./dlnaProfileName')

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
                _content: `http://${HOSTNAME}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}`
            }
        ]
    }
}

async function videoResource({ id, parentId, upnpClass, fsEntry, clientId, readMetadata }) {
    const { title, fileIndex, file } = fsEntry
    const { type, infoHash } = parseObjetcId(parentId)

    const content = [
        { 'dc:title': title },
        { 'upnp:class': upnpClass }
    ]

    let formatedDuration = null
    let profileName = null
    let contentType
    if(readMetadata || checkIfTorrentFileReady(file)) {
        const duration = await metadataService.getDuration(fsEntry.file)
        
        formatedDuration = formatDLNADuration(duration)
        torrentsDatabase.setTorrentFileDuration(infoHash, file.path, duration)

        if(type != 'transcode') {
            [ profileName, contentType ] = await dlnaProfileName(fsEntry.file)
        }
    } else {
        const duration = torrentsDatabase.getTorrentFileDuration(infoHash, file.path)
        if(duration) formatedDuration = formatDLNADuration(duration)
    }

    let resItem
    if(type == 'transcode') {
        const { dlnaFeatures } = tanscoderSettings(clientId)

        resItem = {
            _name: 'res',
            _attrs: {
                'protocolInfo': `http-get:*:video/mpegts:${dlnaFeatures}`,
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'size': file.length
            },
            _content: `http://${HOSTNAME}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}/transcoded?clientId=${clientId}`
        }
    } else {
        let dlnaFeatures
        if(profileName) {
            dlnaFeatures = `DLNA.ORG_PN=${profileName};DLNA.ORG_OP=01;DLNA.ORG_FLAGS=${DLNA_ORIGIN_FLAGS}`
        } else {
            dlnaFeatures = `DLNA.ORG_OP=01;DLNA.ORG_FLAGS=${DLNA_ORIGIN_FLAGS}`
        }
    
        if(!contentType) {
            contentType = mime.lookup(title)
        }

        resItem = {
            _name: 'res',
            _attrs: {
                'protocolInfo': `http-get:*:${contentType}:${dlnaFeatures}`,
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'size': file.length
            },
            _content: `http://${HOSTNAME}:${WEB_PORT}/api/torrents/${infoHash}/files/${fileIndex}`
        }
    }

    if(formatedDuration){
        resItem.duration = formatedDuration
    }

    content.push(resItem)

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
import { createExtractorUrlBuilder, isMobileApp } from './index'
import { createElement } from 'react'
import { API_BASE_URL } from './api'
import urlJoin from 'url-join'

export function getTorrentFileContentLink(hashInfo, fileIndex) {
    return `/api/torrents/${hashInfo}/files/${fileIndex}`
}

export function getFileContentDownloadLink({ url, extractor, downloadUrl}) {
    if(downloadUrl)
        return downloadUrl
    
    if(url) {
        if(extractor) {
            return createExtractorUrlBuilder(extractor, { noredirect: true })(url)
        }

        return url
    }
}

export function createDownloadSecondaryActions(file) {
    const downloadLink = getFileContentDownloadLink(file)

    if(!downloadLink) {
        return null
    }

    if(isMobileApp()) {
        return  [
            { 
                title: 'Download',
                action: () => {
                    mobileApp.downloadFile(urlJoin(API_BASE_URL, downloadLink), ensureExtension(file.name, 'mpeg'))
                }
            }
        ]
    }

    return [
        { 
            title: createElement(
                'a',
                {
                    href: downloadLink,
                    download: file.name,
                    target: '_blank'
                },
                'Download'
            ), 
        }
    ]
}

export function creatDirectoryAction(details, orginalAction) {
    return (directory ) => orginalAction({
        ...details,
        files: directory.files,
        name: `${details.name} / ${directory.name}`
    })
}

function ensureExtension(filename, ext) {
    return (filename.lastIndexOf('.') == -1) ? `${filename}.${ext}` : filename
}
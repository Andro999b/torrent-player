import { action, observable } from 'mobx'
import request from 'superagent'
import { 
    getTorrentFileContentLink, 
    getTorrentHLSLink, 
    getTorrentHLSKeepAliveLink, 
    isPlayable 
} from '../utils'
import notificationStore from './notifications-store'
import playerStore, { LocalDevice } from './player-store'

const testMedia = document.createElement('video')

class TransitionStore {
    @observable screen = 'search'

    @action.bound goToScreen(screen) {
        this.screen = screen
    }

    @action.bound download(torrentInfo) {
        this.downloadTorrent(torrentInfo)
            .then(() => this.screen = 'torrents')
    }

    @action.bound downloadAndPlay(torrentInfo, fileIndex) {
        this.downloadTorrent(torrentInfo)
            .then((torrent) => this.playMedia(torrent, fileIndex))
    }

    @action.bound downloadAndCast(torrentInfo, fileIndex) {
        this.downloadTorrent(torrentInfo)
            .then((torrent) => this.playMedia(torrent, fileIndex))
    }

    @action.bound playMedia(torrent, fileIndex) {
        this.screen = 'player'
        const { playlist, startIndex } = this.parseTorrentInfo(torrent, fileIndex)
        playerStore.openPlaylist(new LocalDevice(), playlist, startIndex, torrent)
    }

    @action.bound castMedia(torrent, fileName) { // eslint-disable-line
        //this.screen = 'player'
        //playerStore.openPlaylist(this.parseTorrentFiles(torrent), fileName)
    }

    @action.bound downloadTorrent(torrentInfo) {
        const { magnetUrl, torrentUrl } = torrentInfo
        return request
            .post('/api/torrents', { magnetUrl, torrentUrl })
            .then((res) => {
                notificationStore.showMessage(`Starting download torrent ${torrentInfo.name}`)
                return res.body
            })
            .catch(() => {
                notificationStore.showMessage(`Fail download torrent ${torrentInfo.name}`)
            })
    }

    parseTorrentInfo(torrent, fileIndex) {
        const files = torrent.files
            .map((file, fileIndex) => {
                let url, hls = false, keepAliveUrl = null
                if (testMedia.canPlayType(file.mimeType) !== '') {
                    url = getTorrentFileContentLink(torrent.infoHash, fileIndex)
                } else {
                    hls = true
                    url = getTorrentHLSLink(torrent.infoHash, fileIndex)
                    keepAliveUrl = getTorrentHLSKeepAliveLink(torrent.infoHash, fileIndex)
                }

                return {
                    name: file.name,
                    path: file.path,
                    source: { url, hls, keepAliveUrl }
                }
            })
            .filter((file) => isPlayable(file.name))

        const file = torrent.files[fileIndex]
        let startIndex = 0
        
        if(file) {
            startIndex = files.findIndex((item) => item.path == file.path)
            if(startIndex < 0) startIndex = 0
        }

        return {
            playlist: {
                name: torrent.name,
                files
            },
            startIndex
        }
    }
}

export default new TransitionStore()
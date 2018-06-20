import { action, observable } from 'mobx'
import request from 'superagent'
import { getTorrentFileContentLink, getTorrentHLSLink, isPlayable } from '../utils'
import notificationStore from './notifications-store'
import playerStore from './player-store'

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

    @action.bound downloadAndPlay(torrentInfo, fileName) {
        this.downloadTorrent(torrentInfo)
            .then((torrent) => this.playMedia(torrent, fileName))
    }

    @action.bound downloadAndCast(torrentInfo, fileName) {
        this.downloadTorrent(torrentInfo)
            .then((torrent) => this.playMedia(torrent, fileName))
    }

    @action.bound playMedia(torrent, fileName) {
        this.screen = 'player'
        playerStore.play(this.parseTorrentFiles(torrent), fileName, torrent)
    }

    @action.bound castMedia(torrent, fileName) { // eslint-disable-line
        //this.screen = 'player'
        //playerStore.play(this.parseTorrentFiles(torrent), fileName)
    }

    @action.bound downloadTorrent(torrentInfo) {
        return request
            .post('/api/torrents', {
                magnetUrl: torrentInfo.magnetUrl
            })
            .then((res) => {
                notificationStore.showMessage(`Starting download torrent ${torrentInfo.name}`)
                return res.body
            })
            .catch(() => {
                notificationStore.showMessage(`Fail download torrent ${torrentInfo.name}`)
            })
    }

    parseTorrentFiles(torrent) {
        return torrent.files
            .map((file, fileIndex) => {
                let url, hls = false
                if(testMedia.canPlayType(file.mimeType) !== ''){
                    url = getTorrentFileContentLink(torrent.infoHash, fileIndex)
                } else {
                    hls = true
                    url = getTorrentHLSLink(torrent.infoHash, fileIndex)
                }
                
                return {
                    name: file.name,
                    source: { url, hls }
                }
            })
            .filter((file) => isPlayable(file.name))
    }
}

export default new TransitionStore()
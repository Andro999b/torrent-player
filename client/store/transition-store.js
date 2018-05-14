import { observable, action } from 'mobx'
import notificationStore from './notifications-store'
import playerStore from './player-store'
import request from 'superagent'
import { isPlayable, getTorrentFileContentLink, getTorrentFileTranscodeLink } from '../utils'

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
            .then((torrent) => this.playTorrent(torrent, fileName))
    }

    @action.bound downloadAndCast(torrentInfo, fileName) {
        this.downloadTorrent(torrentInfo)
            .then((torrent) => this.playTorrent(torrent, fileName))
    }

    @action.bound playTorrent(torrent, fileName) {
        this.screen = 'player'
        playerStore.play(this.parseTorrentFiles(torrent), fileName)
    }

    @action.bound castTorrent(torrent, fileName) {
        this.screen = 'player'
        playerStore.play(this.parseTorrentFiles(torrent), fileName)
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
            .map((file, fileIndex) => ({
                name: file.name,
                source: {
                    url: getTorrentFileTranscodeLink(torrent.infoHash, fileIndex)
                } 
            }))
            .filter((file) => isPlayable(file.name))
    }
}

export default new TransitionStore()
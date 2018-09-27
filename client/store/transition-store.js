import { action, observable } from 'mobx'
import request from 'superagent'
import { 
    getTorrentFileContentLink, 
    getTorrentHLSLink, 
    getTorrentHLSKeepAliveLink, 
    isPlayable
} from '../utils'
import pick from 'lodash.pick'
import notificationStore from './notifications-store'
import playerStore, { LocalDevice } from './player-store'
import remoteControl from './remote-control'

const testMedia = document.createElement('video')

class TransitionStore {
    @observable castDialog = null
    @observable screen = 'search'

    @action.bound goToScreen(screen) {
        this.screen = screen
    }

    @action.bound download(result) {
        this.screen = 'torrents'
        this.downloadTorrent(result) 
            .catch(console.error)
    }

    @action.bound downloadAndPlay(result, item) {
        this.screen = 'player'
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({ ...params, result }))
            .catch(console.error)
    }

        
    @action.bound downloadAndPlayMediaOnDevice(result, item, device) {
        this.screen = 'player'
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({...params, device, result}))
            .catch(console.error)
    }

    playTorrentMedia = (result, item) => {
        this.playMedia({...result, type: 'torrent' }, item)
    }

    @action.bound playMedia(result, item) {
        this.screen = 'player'
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({ ...params, result }))
            .catch(console.error)
    }

    @action.bound playMediaOnDevice({ playlist, startIndex, device, result }) {
        playerStore.openPlaylist(
            device ? remoteControl.getRemoteDevice(device) : new LocalDevice(), 
            playlist, 
            startIndex, 
            result.type == 'torrent' ? result : null
        )

        this.castDialog = null
    }

    openCastTorrentDialog = (result, item) => {
        this.openCastDialog({...result, type: 'torrent' }, item)
    }

    @action.bound openCastDialog(result, item) {
        this.castDialog = { result, item }
    }

    @action.bound closeCastDailog() {
        this.castDialog = null
    }

    downloadPlaylist(result, item) {
        if(result.type == 'directMedia') {
            return Promise.resolve({
                startIndex: item.index,
                playlist: pick(result, 'name', 'files')
            })
        }

        if(result.type == 'torrent') {
            if(result.magnetUrl || result.torrentUrl) {
                return this.downloadTorrent(result)
                    .then((torrent) => ({...this.parseTorrent(torrent, item), torrent}))
            }

            return Promise.resolve({...this.parseTorrent(result, item), result})
        }

        throw Error('Unsupported result type')
    }

    downloadTorrent(result) {
        const { magnetUrl, torrentUrl } = result

        return request
            .post('/api/torrents', { magnetUrl, torrentUrl })
            .then((res) => {
                notificationStore.showMessage(`Starting download torrent ${result.name}`)
                return res.body
            })
            .catch(() => {
                notificationStore.showMessage(`Fail download torrent ${result.name}`)
                this.screen = 'torrents'
            })
    }

    parseTorrent(torrent, tragetItem) {
        const files = torrent.files
            .filter((file) => isPlayable(file.name))
            .map((file, fileIndex) => {
                let url, hls = false, keepAliveUrl = null
                if (testMedia.canPlayType(file.mimeType) !== '') {
                    url = getTorrentFileContentLink(torrent.infoHash, file.id)
                } else {
                    hls = true
                    url = getTorrentHLSLink(torrent.infoHash,  file.id)
                    keepAliveUrl = getTorrentHLSKeepAliveLink(torrent.infoHash,  file.id)
                }

                return {
                    index: fileIndex,
                    id: file.id,
                    name: file.name,
                    path: file.path,
                    url,
                    hls,
                    keepAliveUrl
                }
            })

        let startIndex = 0
        
        if(tragetItem) {
            startIndex = files.findIndex((item) => item.id == tragetItem.id)
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

    @action.bound stopPlayMedia() {
        playerStore.closePlaylist()
        this.screen = 'torrents'
    }
}

export default new TransitionStore()
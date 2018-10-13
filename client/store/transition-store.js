import { action, observable } from 'mobx'
import request from 'superagent'
import pick from 'lodash.pick'
import notificationStore from './notifications-store'
import playerStore, { LocalDevice } from './player-store'
import remoteControl from './remote-control'

class TransitionStore {
    @observable castDialog = null
    @observable screen = 'search'
    prevScreen = null

    @action.bound goToScreen(screen) {
        if(this.screen == screen) return
        
        this.prevScrean = this.screen
        this.screen = screen
    }

    @action.bound goBack() {
        if(this.prevScrean) {
            this.screen = this.prevScrean
            this.prevScrean = null
        }
    }

    @action.bound download(result) {
        this.goToScreen('torrents')
        this.downloadTorrent(result) 
            .catch(console.error)
    }

    @action.bound downloadAndPlay(result, item) {
        this.goToScreen('player')
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({ ...params, result }))
            .catch(console.error)
    }

        
    @action.bound downloadAndPlayMediaOnDevice(result, item, device) {
        this.goToScreen('player')
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({...params, device, result}))
            .catch(console.error)
    }

    playTorrentMedia = (result, item) => {
        this.playMedia({...result, type: 'torrent' }, item)
    }

    @action.bound playMedia(result, item) {
        this.goToScreen('player')
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
        this.castDialog = { 
            onDeviceSelected: (device) => {
                this.downloadAndPlayMediaOnDevice(result, item, device)
            }
        }
    }

    showConnectToDeviceDialog() {
        this.castDialog = {
            filter: (device) => device.playlistName != null,
            onDeviceSelected: (device) => this.connectToDevice(device)
        }
    }

    @action.bound connectToDevice(device) {
        playerStore.loadDevice(remoteControl.getRemoteDevice(device))
        this.castDialog = null
        this.goToScreen('player')
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
                return this
                    .downloadTorrent(result)
                    .then((torrent) => 
                        this.downloadTorrentPlaylist(torrent, item)
                    )
  
            }

            return this.downloadTorrentPlaylist(result, item)
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

    downloadTorrentPlaylist(torrent, tragetItem) {
        return request
            .get(`/api/torrents/${torrent.infoHash}/playlist`)
            .then((res) => {
                const playlist = res.body
                const { files } = playlist
                let startIndex = 0
        
                if(tragetItem) {
                    startIndex = files.findIndex((item) => item.id == tragetItem.id)
                    if(startIndex < 0) startIndex = 0
                }

                return { playlist, startIndex, result: torrent }
            })
    }

    @action.bound stopPlayMedia() {
        playerStore.closePlaylist()
        this.goBack()
    }
}

export default new TransitionStore()
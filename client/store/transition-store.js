import { action, observable } from 'mobx'
import { request } from '../utils/api'
import pick from 'lodash.pick'
import libraryStore from './library-store'
import playerStore, { LocalDevice } from './player-store'
import remoteControl from './remote-control'
import localStore from 'store'

const MAIN_SCREENS = new Set(['search', 'library', 'cast-screan'])

class TransitionStore {
    @observable castDialog = null
    @observable screen = localStore.get('lastScreen') || 'search'
    prevScreen = this.screen

    @action.bound goToScreen(screen) {
        if(this.screen == screen) return
        
        if(MAIN_SCREENS.has(this.screen))
            this.prevScrean = this.screen

        this.screen = screen
        if(MAIN_SCREENS.has(screen))
            localStore.set('lastScreen', screen)
    }

    @action.bound goBack() {
        if(this.prevScrean) {
            this.screen = this.prevScrean
            this.prevScrean = null
        }
    }

    @action.bound download(result) {
        this.goToScreen('library')
        libraryStore
            .addTorrent(result)
            .catch(console.error)
    }

    @action.bound downloadAndPlay(result, item, startTime) {
        this.goToScreen('player')
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({ 
                ...params, 
                result, 
                startTime 
            }))
            .catch(console.error)
    }

        
    @action.bound downloadAndPlayMediaOnDevice(result, item, device, startTime) {
        this.goToScreen('player')
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({
                ...params, 
                device, 
                result, 
                startTime
            }))
            .catch(console.error)
    }

    playTorrentMedia = (result, item, startTime) => {
        this.playMedia(
            {
                ...result, 
                type: 'torrent' 
            }, 
            item, 
            startTime
        )
    }

    @action.bound playMedia(result, item, startTime) {
        this.goToScreen('player')
        this.downloadPlaylist(result, item)
            .then((params) => this.playMediaOnDevice({ 
                ...params, 
                result, 
                startTime 
            }))
            .catch(console.error)
    }

    @action.bound playMediaOnDevice({ 
        playlist, 
        startIndex, 
        startTime, 
        device
    }) {
        playerStore.openPlaylist(
            device ? remoteControl.getRemoteDevice(device) : new LocalDevice(), 
            playlist, 
            startIndex,
            startTime
        )

        this.castDialog = null
    }

    openCastTorrentDialog = (result, item) => {
        this.openCastDialog({...result, type: 'torrent' }, item)
    }

    @action.bound openCastDialog(result, item, startTime) {
        const onDeviceSelected = (device) => {
            this.downloadAndPlayMediaOnDevice(
                result, 
                item, 
                device, 
                startTime
            )
        }

        //do not show dialog if only one device avaliable
        if(remoteControl.devices.length == 1) {
            onDeviceSelected(remoteControl.devices[0])
            return
        }

        this.castDialog = { onDeviceSelected }
    }

    showConnectToDeviceDialog() {
        const deviceFilter = (device) => device.playlistName != null

        //do not show dialog if only one device avaliable
        const devices = remoteControl
            .devices
            .filter(deviceFilter)

        if(devices.length == 1) {
            this.connectToDevice(devices[0])
            return
        }

        this.castDialog = {
            filter: deviceFilter,
            onDeviceSelected: this.connectToDevice
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
        if(result.type == 'torrent') {
            if(result.magnetUrl || result.torrentUrl) {
                return libraryStore
                    .addTorrent(result)
                    .then((torrent) => 
                        this.downloadTorrentPlaylist(torrent, item)
                    )
  
            }
            return this.downloadTorrentPlaylist(result, item)
        }

        return Promise.resolve({
            startIndex: item.index,
            playlist: pick(result, 'name', 'files', 'torrentInfoHash')
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
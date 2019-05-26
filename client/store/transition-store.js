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

    @action.bound download(results) {
        this.goToScreen('library')
        libraryStore
            .addTorrent(results)
            .catch(console.error)
    }

    @action.bound downloadAndPlay(results, selectedItem) {
        this.goToScreen('player')
        this._downloadPlaylist(results, selectedItem)
            .then((params) => this.playMediaOnDevice({ 
                ...params, 
                results 
            }))
            .catch(console.error)
    }

        
    @action.bound downloadAndPlayMediaOnDevice(results, selectedItem, device) {
        this.goToScreen('player')
        this._downloadPlaylist(results, selectedItem)
            .then((params) => this.playMediaOnDevice({
                ...params, 
                device, 
                results
            }))
            .catch(console.error)
    }

    @action.bound playTorrentMedia(results, selectedItem) {
        this.playMedia(
            {
                ...results, 
                type: 'torrent' 
            }, 
            selectedItem
        )
    }

    @action.bound playMedia(results, selectedItem) {
        this.goToScreen('player')
        this._downloadPlaylist(results, selectedItem)
            .then((params) => this.playMediaOnDevice({ 
                ...params, 
                results 
            }))
            .catch(console.error)
    }

    @action.bound playMediaOnDevice({ 
        playlist, 
        startIndex, 
        device
    }) {
        playerStore.openPlaylist(
            device ? remoteControl.getRemoteDevice(device) : new LocalDevice(), 
            playlist, 
            startIndex
        )

        this.castDialog = null
    }

    @action.bound openCastTorrentDialog (results, selectedItem) {
        this.openCastDialog({...results, type: 'torrent' }, selectedItem)
    }

    @action.bound openCastDialog(results, selectedItem) {
        const onDeviceSelected = (device) => {
            this.downloadAndPlayMediaOnDevice(
                results, 
                selectedItem, 
                device
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

    _downloadPlaylist(results, selectedItem) {
        if(results.type == 'torrent') {
            if(results.magnetUrl || results.torrentUrl) {
                return libraryStore
                    .addTorrent(results)
                    .then((torrent) => 
                        this._downloadTorrentPlaylist(torrent, selectedItem)
                    )
  
            }
            return this._downloadTorrentPlaylist(results, selectedItem)
        }

        // result already contain playlist
        let startIndex = 0
        if(selectedItem) {
            const selectedItemIndex = results.files.findIndex((i) => i.id == selectedItem.id)
            if(selectedItemIndex != -1) startIndex = selectedItemIndex
        }

        return Promise.resolve({
            startIndex,
            playlist: pick(results, 'name', 'files', 'torrentInfoHash', 'image')
        })
    }

    _downloadTorrentPlaylist(torrent, tragetItem) {
        const ids =new Set(torrent.files.map((i) => i.id))
        return request
            .get(`/api/torrents/${torrent.infoHash}/playlist`)
            .then((res) => {
                const playlist = res.body
                let { files } = playlist
                let startIndex = 0
        
                files = files.filter((file) => ids.has(file.id))

                if(tragetItem) {
                    startIndex = files.findIndex((selectedItem) => selectedItem.id == tragetItem.id)
                    if(startIndex < 0) startIndex = 0
                }

                playlist.files = files

                return { playlist, startIndex, results: torrent }
            })
    }

    @action.bound stopPlayMedia() {
        playerStore.closePlaylist()
        this.goBack()
    }
}

export default new TransitionStore()
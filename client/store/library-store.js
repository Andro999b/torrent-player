import { observable, action } from 'mobx'
import { request } from '../utils/api'
import notificationStore from './notifications-store'
import transitionStore from './transition-store'

class LibraryStore {
    @observable library = {
        bookmarks: [],
        torrents: []
    }
    @observable loading = true

    updateId = 0

    updateLibrary() {
        request
            .get('/api/library')
            .then((res) => {
                this.library = res.body
                this.loading = false
            })
            .catch((err) => {
                this.loading = false
                console.error(err)
                notificationStore.showMessage('Failed to load library')
            })
    }

    @action startUpdate() {
        if (this.updateId === 0) {
            this.updateId = setInterval(() => this.updateLibrary(), 5000)
            this.updateLibrary()
        }
    }

    @action stopUpdate() {
        clearInterval(this.updateId)
        this.updateId = 0
    }

    @action deleteTorrent(torrent) {
        this.loading = true
        request
            .delete(`/api/torrents/${torrent.infoHash}`)
            .then(() => {
                this.updateLibrary()
                notificationStore.showMessage(`Torrent ${torrent.name} was removed`)
            })
            .catch((err) => {
                this.loading = false
                console.error(err)
                notificationStore.showMessage(`Fail to remove torrent ${torrent.name}`)
            })
    }

    @action removeBookmark(item) {
        this.loading = true
        request
            .delete(`/api/library/bookmarks/${encodeURIComponent(item.playlist.name)}`)
            .then(() => {
                this.updateLibrary()
                notificationStore.showMessage(`Playlist ${item.playlist.name} removed from history`)
            })
            .catch((err) => {
                this.loading = false
                console.error(err)
                notificationStore.showMessage(`Failed to clean playlist ${item.playlist.name}`)
            })
    }

    @action setBackgroudDownload(torrent) {
        const enabled = !torrent.downloadInBackground
        request
            .post(`/api/torrents/${torrent.infoHash}/backgroundDownload`)
            .send({ enabled })
            .then(() => {
                torrent.downloadInBackground = enabled
            })
            .catch((err) => {
                console.error(err)
                notificationStore.showMessage(`Failed to set backgroud download status for torrent ${torrent.name}`)
            })
    }

    @action addTorrent(result) {
        this.loading = true
        return request
            .post('/api/torrents', result)
            .then((res) => {
                this.updateLibrary()
                notificationStore.showMessage(`Torrent ${result.name} added`)
                return res.body
            })
            .catch(() => {
                this.loading = false
                notificationStore.showMessage(`Failed to add torrent ${result.name}`)
                transitionStore.goBack()
            })
    }
}

export default new LibraryStore
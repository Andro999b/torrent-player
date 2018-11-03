import { observable, action } from 'mobx'
import superagent from 'superagent'

import notificationStore from './notifications-store'
import playerStore from './player-store'

class LibraryStore {
    @observable library = {
        bookmarks: [],
        torrents: []
    }
    @observable loading = true

    updateId = 0

    updateLibrary() {
        superagent
            .get('/api/library')
            .then((res) => {
                this.library = res.body
                this.loading = false
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
        superagent
            .delete(`/api/torrents/${torrent.infoHash}`)
            .then(() => {
                this.updateLibrary()
                notificationStore.showMessage(`Torrent ${torrent.name} was removed`)
                playerStore.closeTorrent(torrent)
            })
            .catch((err) => {
                this.loading = false
                console.error(err)
                notificationStore.showMessage(`Fail to remove torrent ${torrent.name}`)
            })
    }

    @action removeBookmark(item) {
        this.loading = true
        superagent
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
        superagent
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
        const { magnetUrl, torrentUrl, provider } = result

        this.loading = true
        return superagent
            .post('/api/torrents', { magnetUrl, torrentUrl, provider })
            .then((res) => {
                this.updateLibrary()
                notificationStore.showMessage(`Torrent ${result.name} added`)
                return res.body
            })
            .catch(() => {
                this.loading = false
                notificationStore.showMessage(`Failed to add torrent ${result.name}`)
                this.screen = 'torrents'
            })
    }
}

export default new LibraryStore
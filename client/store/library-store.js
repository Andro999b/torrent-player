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
        superagent
            .delete(`/api/torrents/${torrent.infoHash}`)
            .then(() => {
                this.updateLibrary()
                notificationStore.showMessage(`Torrent ${torrent.name} was removed`)
                playerStore.closeTorrent(torrent)
            })
            .catch((err) => {
                console.error(err)
                notificationStore.showMessage(`Fail to remove torrent ${torrent.name}`)
            })
    }

    @action removeBookmark(item) {
        superagent
            .delete(`/api/library/bookmarks/${encodeURIComponent(item.playlist.name)}`)
            .then(() => {
                this.updateLibrary()
                notificationStore.showMessage(`Playlist ${item.playlist.name} removed from history`)
            })
            .catch((err) => {
                console.error(err)
                notificationStore.showMessage(`Fail to clean playlist ${item.playlist.name}`)
            })
    }
}

export default new LibraryStore
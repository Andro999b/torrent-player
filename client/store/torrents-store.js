import { observable, action } from 'mobx'
import request from 'superagent'

import notificationStore from './notifications-store'

class TorrentsStore {
    @observable torrents = []
    @observable loading = true

    updateId = 0

    updateTorrents() {
        request
            .get('/api/torrents')
            .then((res) => {
                this.torrents = res.body
                this.loading = false
            })
    }

    @action startUpdate() {
        if (this.updateId === 0) {
            this.updateId = setInterval(() => this.updateTorrents(), 1000)
            this.updateTorrents()
        }
    }

    @action stopUpdate() {
        clearInterval(this.updateId)
        this.updateId = 0
    }

    @action deleteTorrent(torrent) {
        request
            .delete(`/api/torrents/${torrent.infoHash}`)
            .then(() => {
                this.updateTorrents()
                notificationStore.showMessage(`Torrent ${torrent.name} was removed`)
            })
            .catch((err) => {
                console.error(err)
                notificationStore.showMessage(`Fail to remove torrent ${torrent.name}`)
            })
    }
}

export default new TorrentsStore
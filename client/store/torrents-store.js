import { observable, action } from 'mobx'
import request from 'superagent'

class TorrentsStore {
    @observable torrents = []


    updateId = 0

    updateTorrents() {
        request
            .get('/api/torrents')
            .then((res) => this.torrents = res.body)
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
}

export default new TorrentsStore
import { observable, action, autorun } from 'mobx'

class NavigationStore {
    @observable screen = 'search'

    @action goToScreen(screen) {
        this.screen = screen
    }

    @action goToSearch() {
        this.screen = 'search'
    }
    
    @action goToTorrents() {
        this.screen = 'torrents'
    }

    @action goToPlayer() {
        this.screen = 'player'
    }
}

export default new NavigationStore()
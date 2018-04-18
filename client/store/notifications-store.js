import { observable, action } from 'mobx'

class NotificationsStore {
    @observable message = null
    @observable open = false

    @action showMessage(message) {
        this.message = message
        this.open = true
    }

    @action hideMessage() {
        this.open = false
    }
}

export default new NotificationsStore()
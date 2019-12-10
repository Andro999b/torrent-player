import { observable, action } from 'mobx'

class NotificationsStore {
    @observable message = null
    @observable open = false

    @action.bound showMessage(message) {
        this.message = message
        this.open = true
    }

    @action.bound hideMessage() {
        this.open = false
    }
}

export default new NotificationsStore()
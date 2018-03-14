/* eslint-disable */

import { observable, autorun } from "mobx"


class OutputDevice {
    isRemote() { return false }
}

class LocalOutput {
    
}

class RemoteOutput {
    isRemote() { return true }
}

class PlayerStore {
    @observable output = null

    constructor() {
        autorun(() => {

        }, { delay: 1000 })
    }

    setOutput(output) {
        this.output = output
    }
}

/* eslint-enable rule */
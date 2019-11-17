
import { request } from '../../utils/api'
import { diff } from '../../utils'
import pick from 'lodash.pick'
import { autorun } from 'mobx'
import playerStore from '../player-store'

export default () => {
    let prevState = {}
    autorun(() => {
        const { device } = playerStore
        if (device && device.isLocal()) {
            const playlistId= device.playlist.id
            const newState = pick(device, ['playlist', 'marks', 'currentFileIndex'])
            
            const stateDiff = diff(prevState, newState)
            
            prevState = newState

            if(Object.keys(stateDiff).length > 0) {
                request
                    .post(`/api/library/bookmarks/${playlistId}`)
                    .send(stateDiff)
                    .then()
            }
        }
    }, { delay: 10000 })
}
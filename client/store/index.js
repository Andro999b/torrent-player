import transitionStore from './transition-store'
import notificationStore from './notifications-store'
import libraryStore from './library-store'
import searchStore from './search-store'
import playerStore from './player-store'
import remoteControl from './remote-control'
import { autorun } from 'mobx'

// autorun(() => {
//     console.log(searchStore.searchResults.length)
// })

export default {
    transitionStore, 
    notificationStore, 
    libraryStore, 
    searchStore, 
    playerStore,
    remoteControl
}
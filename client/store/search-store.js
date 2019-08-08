import { observable, action } from 'mobx'
import { request, fetchOnce, getConfig } from '../utils/api'
import notificationStore from './notifications-store'
import { 
    SEARCH_RPOVIDERS, 
    SEARCH_RPVODERS_PRESET, 
    SEARCH_HISTORY_MAX_SIZE, 
    DEFUALT_SEARCH_PROVIDERS, 
    NO_TORRENTS_SEARCH_RPOVIDERS,
    NO_TORRENTS_SEARCH_RPVODERS_PRESET
} from '../constants'
import localStore from 'store'

const fetchSuggestions = fetchOnce()
const searchProvidersFetch = Object.keys(SEARCH_RPOVIDERS).reduce((acc, provider) => {
    acc[provider] = fetchOnce()
    return acc
}, {})

class SearchReusltItem {
    @observable details = null
    @observable loadingDetails = false
    @observable loadingError = null

    constructor(data) {
        Object.assign(this, data)
    }

    needLoadDetails() {
        if(this.details || this.loadingDetails || this.loadingError)
            return false
        return true 
    }

    isTorrent() {
        return this.details && this.details.type == 'torrent'
    }

    isDownlodableTorrent() {
        return this.details && 
            (this.details.magnetUrl || this.details.torrentUrl)
    }


    hasFiles() {
        return this.details && 
            this.details.files && 
            this.details.files.length > 0
    }

    @action loadDetails() {
        if(!this.needLoadDetails()) return

        this.loadingDetails = true

        request
            .get(`/api/trackers/${this.provider}/items/${this.id}`)
            .then((res) => {
                const details = res.body
                if(!details.name) details.name = this.name

                this.details = details
                this.loadingDetails = false
                
            })
            .catch((err) => {
                console.error(err)
                this.loadingError = 'Fail to fetch details'
                this.loadingDetails = false
            })
    }
}

class SearchStore {
    @observable suggestions = []
    @observable searchResults = []
    @observable loading = false
    @observable searchProviders = []
    @observable avalaibleSearchProviders = []
    @observable avalaibleSearchPresets = []
    
    searchHistory = localStore.get('searchHistory') || []
    waitingSuggestions = true

    constructor() {
        this.initialize()
    }

    @action
    initialize() {
        getConfig().then(({torrentsProviders}) => {
            const storedSearchProviders = localStore.get('searchProviders') || DEFUALT_SEARCH_PROVIDERS
            const avalaibleSearchProviders = torrentsProviders ? 
                Object.keys(SEARCH_RPOVIDERS):
                Object.keys(NO_TORRENTS_SEARCH_RPOVIDERS)
            
            this.avalaibleSearchProviders = avalaibleSearchProviders
            this.avalaibleSearchPresets = torrentsProviders ? 
                SEARCH_RPVODERS_PRESET:
                NO_TORRENTS_SEARCH_RPVODERS_PRESET
    
            this.searchProviders = storedSearchProviders.filter((p) => avalaibleSearchProviders.includes(p))
        })
    }

    @action selectProviders(providers) {
        localStore.set('searchProviders', providers)
        this.searchProviders = providers
    }

    @action suggest(searchQuery) {
        if (searchQuery) {
            searchQuery = searchQuery.toLowerCase()

            this.waitingSuggestions = true
            this.suggestions = this.searchHistory
                .filter((text) => text.search(searchQuery) != -1)
                .map((text) => ({
                    history: true,
                    text
                }))

            fetchSuggestions(`/api/suggestions?q=${searchQuery}`)
                .then((res) => {
                    if (this.waitingSuggestions)
                        this.suggestions = this.suggestions.concat(
                            res.body.map((text) => ({text}))
                        )
                })
        } else {
            this.waitingSuggestions = false
            this.suggestions = []
        }
    }

    @action search(searchQuery) {
        if(this.searchProviders.length == 0) {
            notificationStore.showMessage('No search providers selected')
            return
        }

        searchQuery = searchQuery.toLowerCase()

        this.updateSearchHistory(searchQuery)
        this.waitingSuggestions = false
        this.suggestions = []
        this.searchResults = []
        this.loading = true

        const fetches = this.searchProviders.map((provider) => {
            const fetch = searchProvidersFetch[provider]
            return fetch(`/api/trackers/${provider}/search`)
                .query({ q: searchQuery })
                .then((res) => res.body)
                .catch((err) => {
                    console.error(err)
                    notificationStore.showMessage('Fail to fetch results')
                })
        })

        Promise.all(fetches).then((fetchesResults) => {
            let searchResults = []
            fetchesResults.forEach((results) => {
                if (results) {
                    results.forEach((item) => searchResults.push(new SearchReusltItem(item)))
                }
            })
            this.searchResults = searchResults.sort((a, b) => b.seeds - a.seeds)
            this.loading = false
        })
    }

    @action removeFromHistory(suggestion) {
        const { text } = suggestion
        const { searchHistory, suggestions } = this

        let idx = searchHistory.findIndex((text) => text === text)
        if(idx != -1) {
            searchHistory.splice(idx, 1)
        }

        this.suggestions = suggestions
            .filter((s) => s.text != text)

        localStore.set('searchHistory', searchHistory)
    }

    updateSearchHistory(searchQuery) {
        if(!searchQuery) return

        const { searchHistory } = this

        const idx = searchHistory.findIndex((text) => text === searchQuery)
        if(idx != -1) {
            searchHistory.splice(idx, 1)
        }

        searchHistory.unshift(searchQuery)

        if(searchHistory.length > SEARCH_HISTORY_MAX_SIZE) {
            searchHistory.pop()
        }

        localStore.set('searchHistory', searchHistory)
    }
}

export default new SearchStore()
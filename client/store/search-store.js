import { observable, action } from 'mobx'
import { fetchOnce } from '../utils'
import request from 'superagent'
import notificationStore from './notifications-store'
import { SEARCH_RPVODERS } from '../contants'

const fetchSuggestions = fetchOnce()
const searchProvidersFetch = SEARCH_RPVODERS.reduce((acc, provider) => {
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

    @action loadDetails() {
        if(!this.needLoadDetails()) return

        this.loadingDetails = true

        request
            .get(`/api/trackers/${this.provider}/items/${this.id}`)
            .then((res) => {
                this.details = res.body
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
    @observable searchProviders = SEARCH_RPVODERS.concat([])

    waitingSuggestions = true

    @action selectProviders(providers) {
        this.searchProviders = providers
    }

    @action suggest(searchQuery) {
        if (searchQuery) {
            this.waitingSuggestions = true
            fetchSuggestions(`/api/suggestions?q=${searchQuery}`)
                .then((res) => {
                    if (this.waitingSuggestions)
                        this.suggestions = res.body
                })
        } else {
            this.waitingSuggestions = false
            this.suggestions = []
        }
    }

    @action search(searchQuery) {
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
            this.searchResults = searchResults
            this.loading = false
        })
    }
}

export default new SearchStore()
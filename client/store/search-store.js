import { observable, action } from 'mobx'
import { fetchOnce } from '../utils'
import request from 'superagent'

const fetchSuggestions = fetchOnce()
const searchProviders = ['tfile']
const searchProvidersFetch = searchProviders.reduce((acc, provider) => {
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
            .get(`/api/trackers/${this.provider}/torrents/${this.torrent}`)
            .then((res) => {
                this.details = res.body
                this.loadingDetails = false
            })
            .catch(() => {
                this.loadingError = 'Fail to fetch details'
                this.loadingDetails = false
            })
    }
}

class SearchStore {
    @observable suggestions = []
    @observable searchResults = []
    @observable loading = false

    waitingSuggestions = true

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

        const fetches = searchProviders.map((provider) => {
            const fetch = searchProvidersFetch[provider]
            return fetch(`/api/trackers/${provider}/search`)
                .query({ q: searchQuery })
                .then((res) => res.body)
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
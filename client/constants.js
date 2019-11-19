export const NO_TORRENTS_SEARCH_RPOVIDERS = {
    'animeVost': 'AnimeVost',
    'anidub': 'AniDub',
    'kinokrad': 'Kinokrad',
    'kinogo': 'Kinogo',
    'hdrezka': 'HDRezka',
    'baskino': 'Baskino',
    'seasonvar': 'Seasonvar'
}

export const SEARCH_RPOVIDERS = {
    'rutor': 'RuTor',
    // 'rutracker-movies': 'RuTracker Movies',
    // 'rutracker-tv-shows': 'RuTracker TV Shows',
    // 'rutracker-cartoons': 'RuTracker Cartoons',
    // 'rutracker-anime': 'RuTracker Anime',
    'x1337x-eng': 'x1337x',
    'fastTorrent-movies': 'FastTorrent Movies',
    'fastTorrent-tv-shows': 'FastTorrent TV Shows',
    'fastTorrent-cartoons': 'FastTorrent Cartoons',
    'nnm-movies': 'NNMClub Movies',
    'nnm-cartoons': 'NNMClub Cartoons',
    'nnm-tv-shows': 'NNMClub TV Shows',
    'nnm-anime': 'NNMClub Anime',
    'limetorrents-eng': 'LimeTorrents',
    ...NO_TORRENTS_SEARCH_RPOVIDERS
}

const getProvidersByType = (type) => Object.keys(SEARCH_RPOVIDERS).filter((p) => p.endsWith(type))

export const DEFUALT_SEARCH_PROVIDERS = [
    'hdrezka', 'kinogo', 'animeVost', 'seasonvar'
]

export const NO_TORRENTS_SEARCH_RPVODERS_PRESET = [
    {
        name: 'Anime Hostings',
        providers: ['animeVost', 'anidub']
    },
    {
        name: 'Video Hostings',
        providers: ['hdrezka', 'kinogo', 'baskino']
    }
]

export const SEARCH_RPVODERS_PRESET = [
    {
        name: 'Torrents',
        presets: [
            {
                name: 'Movies',
                providers: getProvidersByType('movies').concat(['rutor'])
            },
            {
                name: 'TV Shows',
                providers: getProvidersByType('tv-shows').concat(['rutor'])
            },
            {
                name: 'Cartoons',
                providers: getProvidersByType('cartoons').concat(['rutor'])
            },
            {
                name: 'Anime',
                providers: getProvidersByType('anime').concat(['rutor'])
            },
            {
                name: 'English',
                providers: getProvidersByType('eng')
            },
        ]
    },
    ...NO_TORRENTS_SEARCH_RPVODERS_PRESET
]

export const SEARCH_HISTORY_MAX_SIZE = 100

export const ALLOWED_REMOTE_STATE_FIELDS = [
    'playlist',
    'marks',
    'currentFileIndex',
    'currentTime',
    'duration',
    'buffered',
    'isPlaying',
    'isLoading',
    'error',
    'volume',
    'isMuted',
    'audioTracks',
    'audioTrack',
]

export const END_FILE_TIME_OFFSET = 60
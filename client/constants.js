export const SEARCH_RPOVIDERS = {
    'rutor': 'RuTor',
    'rutracker-movies': 'RuTracker Movies',
    'rutracker-tv-shows': 'RuTracker TV Shows',
    'rutracker-cartoons': 'RuTracker Cartoons',
    'rutracker-anime': 'RuTracker Anime',
    'fastTorrent-movies': 'FastTorrent Movies',
    'fastTorrent-tv-shows': 'FastTorrent TV Shows',
    'fastTorrent-cartoons': 'FastTorrent Cartoons',
    'nnm-video': 'NNMClub Video',
    'nnm-tv-shows': 'NNMClub TV Shows',
    'nnm-anime': 'NNMClub Anime',
    'animeVost': 'AnimeVost',
    'anidub': 'AniDub',
    'kinokrad': 'Kinokrad',
    'hdrezka': 'HD Rezka'
}

export const DEFUALT_SEARCH_PROVIDERS = [
    'rutor'
]

export const SEARCH_RPVODERS_PRESET = [
    {
        name: 'Torrents',
        presets: [
            {
                name: 'Movies',
                providers: ['rutracker-movies', 'nnm-video', 'fastTorrent-movies', 'rutor']
            },
            {
                name: 'TV Shows',
                providers: ['rutracker-tv-shows', 'nnm-tv-shows', 'fastTorrent-tv-shows', 'rutor']
            },
            {
                name: 'Cartoons',
                providers: ['rutracker-cartoons', 'fastTorrent-cartoons', 'nnm-video', 'rutor']
            },
            {
                name: 'Anime',
                providers: ['rutracker-anime', 'nnm-anime', 'fastTorrent-cartoons', 'rutor']
            }
        ]
    },
    {
        name: 'Anime Hostings',
        providers: ['animeVost', 'anidub']
    },
    {
        name: 'Video Hostings',
        providers: ['kinokrad']
    }
]

export const SEARCH_HISTORY_MAX_SIZE = 100

export const ALLOWED_REMOTE_STATE_FIELDS = [
    'playlist',
    'currentFileIndex',
    'currentTime',
    'duration',
    'buffered',
    'isPlaying',
    'isLoading',
    'error',
    'volume',
    'isMuted'
]

export const END_FILE_TIME_OFFSET = 60
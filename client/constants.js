export const SEARCH_RPVODERS = [
    'rutor', 
    'rutracker-movies',
    'rutracker-tv-shows',
    'rutracker-cartoons',
    'rutracker-anime',
    'nnm-video', 
    'nnm-tv-shows', 
    'nnm-anime', 
    'fastTorrent', 
    'animeVost', 
    'anidub'
]
export const SEARCH_RPVODERS_NAME = {
//   'tfile': 'TFile', // no longer supported
    'rutor': 'RuTor',
    'rutracker-movies': 'RuTracker Movies',
    'rutracker-tv-shows': 'RuTracker TV Shows',
    'rutracker-cartoons': 'RuTracker Cartoons',
    'rutracker-anime': 'RuTracker Anime',
    'fastTorrent': 'FastTorrent',
    'nnm-video': 'NNMClub Video',
    'nnm-tv-shows': 'NNMClub TV Shows',
    'nnm-anime': 'NNMClub Anime',
    'animeVost': 'AnimeVost',
    'anidub': 'AniDub'
// 'coldfilm': 'Coldfilm' // no longer supported
}
export const SEARCH_RPVODERS_PRESET = {
    'movies': ['rutracker-movies', 'nnm-video', 'rutor'],   
    'tv-shows': ['rutracker-tv-shows', 'nnm-tv-shows', 'rutor'],   
    'cartoons': ['rutracker-cartoons', 'nnm-video', 'rutor'],   
    'anime': ['rutracker-anime', 'nnm-anime', 'rutor'],   
    'anime-direct': ['animeVost', 'anidub'],   
}
export const SEARCH_RPVODERS_PRESET_NAMES = {
    'movies': 'Movies',   
    'tv-shows': 'TV Shows',   
    'cartoons': 'Cartoons',   
    'anime': 'Anime Torrents',   
    'anime-direct': 'Anime Online',   
}
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
# Torrent player

Torrents peer player that able to search on popular russian torrent trackers download and play Movies / TV show / Cartoons / Anime.
In addional to this it able to cast video using dlna protocol or serve as dlna media server.
It also support remote controle from mobile or browser and automaticaly transcode video stream using ffmpeg.
Can be runned as web server or desktop application(electron version)

# Download

Checkout [Release](https://github.com/Andro999b/torrent-player/releases) for prebuilded binaries

## Linux dependencies

You probably will need to instal non free encodes libs: libx264, libmp3lame, libfdkaac

# Build and run

install dependencies
```
yarn
cd client && yarn
cd ../server && yarn
```

build and run as electron application
```
yarn start
```

build and run as web server
```
yarn server
```

build ui
```
cd client && yarn build
```

build electron binaries
```
yarn build
```

it will produce zip archives for linux(x64, armv7) and window platforms into directory
```
build/out/electron
```


# Transcoding

Player use ffmpeg for transcoding. Binaries already included in a repo and contains in a tools directory. If you want use system ffmpeg just remove this directory.

# RuTracker setup
Create a file in `root-dir` folder with name `rutracker-session`. Copy `bb_session` value from rutracker site cookie into this file.


# MPV Integration

Electron version use MPV.js plugin see repo https://github.com/Kagami/mpv.js/ for information about how to install mpvlib

# Arguments

--root-dir - path to directory configuration store. default: `$HOME/webtorrents`

--no-dlna - disable dlna media server

--no-dlna-renderers - disable lookup for dlna media rendrers

--dlna-port - dlna media server port

--dlan-uid - dlna media server id: defult: uuid()

--dlan-name - dlna media server name

--web-port - web server port: defualt: 8080

--no-transcoding - disable transcoding

--proxy - use proxy server for search

--proxy-region - enable auto selecting proxy from free proxies list for specific region


## Electron only

--cast-screen - start with ui that can be controlet only remote

--fullscrean - start in fullscrean mode (press F11 for toggle mode)

--no-mpv - disable mpv plugin

--dev-tools - enable developer tools

# Electron sortcuts
`F5` - reload UI

`F11` - toggle fullscreen


# Providers
- AniDUB
- AnimeVost
- FastTorrents
- Kinogo
- Kinokrad
- LimeTorrents
- NNMClub
- RuTor
- Baskino
- Rutracker (disabled)

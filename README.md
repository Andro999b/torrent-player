# Torrent player

Torrents peer player that able to search on popular russian torrent trackers download and play Movies / TV show / Cartoons / Anime.
In addional to this it able to cast video using dlna protocol or serve as dlna media server. 
It also support remote controle from mobile or browser and automaticaly transcode video stream using ffmpeg.
Can be runned as web server or desktop application(electron version)

# Download

Checkout [Release](https://github.com/Andro999b/torrent-player/releases) for prebuilded binaries 

# Build and run

install dependencies
```
yarn 
cd client && yarn 
cd ../server && yarn
```

build ui
```
cd client && yarn build
```

run as web server
```
cd server && yarn start
```

run as electron application
```
yarn start
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

# MPV Integration

Electron version use MPV.js plugin see repo https://github.com/Kagami/mpv.js/ for information about how to install mpvlib

# Arguments

--root-dir - path to directory configuration store. default: `$HOME/webtorrents`

--no-dlna - disable dlna media server 

--no-dlna-renderers - disable lookup for dlna media rendrers

--dlna-port - dlna media server port

--dlan-uuid - dlna media server uuid: defult: random 

--web-port - web server port: defualt: 8080

--no-transcoding - disable transcoding

--transcode-video-encoder - ffmpeg video encoder: default: `libx264`

## Electron only

--cast-screen - start with ui that can be controlet only remote

--fullscreen - start in fullscrean

--no-mpv - disable mpv plugin

--dev-tools - enable developer tools

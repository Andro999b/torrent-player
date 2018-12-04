# Torrent player

Pear play that able to search on popular russian torrent trackers download and play Movies / TV show / Cartoons / Anime.
In addional to this it able to cast video using dnla protocol or serve as dnla media server. 
It also support remote controle from mobile or a browser and automaticaly transcode video stream using ffmpeg.
Can be runned as web server or desktop application(electron version)

# How to run

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

Player use ffmpeg for transcoding. Binaries already included in repo and contains in tools directory. If you want use system ffmpeg just remove this directory.

# RuTracker setup

# MPV Integration

Electron version use NPV.js plugin see repo https://github.com/Kagami/mpv.js/ for information about how to install mpvlib

# Arguments

--root-dir - path to directory configuration store. default: `$HOME/webtorrents`

--no-dnla - disable dlna media server 

--no-dnla-renderers - disable lookup for dlna media rendrers

--dlna-port - dnla media server port

--dlan-uuid - dnla media server uuid: defult: random 

--web-port - web server port: defualt: 8080

--no-transcoding - disable transcoding

--transcode-video-encoder - ffmpeg video encoder: default: `libx264`

## Electron only

--cast-screen - start with ui that can be controlet only remote

--fullscreen - start in fullscrean

--no-mpv - disable mpv plugin

--dev-tools - enable developer tools
const promisify = require('util').promisify
const fs = require('fs')
const path = require('path')
const mkdir = promisify(fs.mkdir)
const cp = promisify(fs.copyFile)
const exists = promisify(fs.exists)

exports.default = async function(context) {
    const { appOutDir, outDir, electronPlatformName: platform } = context
    const arch = ['x64', 'arm'][context.arch - 1]

    const pluginsDir = path.join(outDir, '../../../plugins')
    const toolsDir = path.join(outDir, '../../../tools')

    //copy mpv plugin
    const mpvPluginName = `mpv-${platform}-${arch}.node`
    const mpvPluginPath = path.join(pluginsDir, mpvPluginName)

    const appOutPluginDir = path.join(appOutDir, 'plugins')

    if(await exists(mpvPluginPath)) {
        if(!await exists(appOutPluginDir))
            await mkdir(appOutPluginDir)

        await cp(mpvPluginPath, path.join(appOutPluginDir, mpvPluginName))

        //copy lib mpv
        if(platform == 'win32') {
            const libMpvName = 'mpv-1.dll'
            const libMpvPath = path.join(pluginsDir, 'libs', 'win32-x64', libMpvName)
            if(await exists(libMpvPath)) {
                await cp(libMpvPath, path.join(appOutPluginDir, libMpvName))
            }
        }

        // if(platform == 'linux') { //TODO: change linkage
        //     const libMpvName = 'libmpv.so.1'
        //     for (const arch of ['x64', 'arm']) {
        //         const libMpvPath = path.join(pluginsDir, 'libs', `linux-${arch}`, libMpvName)
        //         if(await exists(libMpvPath)) {
        //             await cp(libMpvPath, path.join(appOutDir, libMpvName))
        //         }
        //     }
        // }
    }

    //copy ffmpeg and ffprobe
    const exeEnding = platform == 'win32'?'.exe':''
    const ffmpegName = `${platform}-${arch}-ffmpeg${exeEnding}`
    const ffprobeName = `${platform}-${arch}-ffprobe${exeEnding}`
    const ffmpegPath = path.join(toolsDir, ffmpegName)
    const ffprobePath = path.join(toolsDir, ffprobeName)

    if(await exists(ffmpegPath) && await exists(ffprobePath)) {
        const appOutToolsDir = path.join(appOutDir, 'tools')

        if(!await exists(appOutToolsDir))
            await mkdir(appOutToolsDir)

        await cp(ffmpegPath, path.join(appOutToolsDir, ffmpegName))
        await cp(ffprobePath, path.join(appOutToolsDir, ffprobeName))
    }
}
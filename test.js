var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var converter = new ffmpeg({ source : 'Kendrick Lamar - M.A.A.D. City (Feat. MC eiht)-10yrPDf92hY.mp4'} )
    .withVideoBitrate(1024)
    .withAudioBitrate('128k')
    .toFormat('mp3')
    .writeToStream(fs.createWriteStream('fuck.mp3'));
console.log("Here!");


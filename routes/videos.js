exports.videos = function (req, res) {
    var videoID = req.params.videoID;
    if (videoID == "undefined") {
	res.send("Video ID is not valid.");
	return;
    }
    res.writeHead(200, {"Content-Type" : "audio/mp3"});
    var videoURL = "https://www.youtube.com/watch?v=" + videoID;
    var videoStream = dl(videoURL);
    var converter = new ffmpeg({source : videoStream, timeout: 300})
	.withVideoBitrate(1024)
	.withAudioBitrate('128k')
	.toFormat('mp3')
	.writeToStream(res, function (retcode, err) {
	    if (err) {
		console.log("A pipe closed.");
		res.end()
	    }
	    else {
		console.log("The conversion pipe succeeded!");
	    }
	});
}
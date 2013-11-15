#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var dl = require('ytdl');
var ffmpeg = require('fluent-ffmpeg');

app.set("view engine", "jade");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

app.get("/favicon.ico", function (req, res) {
    res.sendfile("favicon.ico");
});

app.get('/videos/:videoID', function (req, res) {
    var videoID = req.params.videoID;
    if (videoID == "undefined") {
	res.send("Error!");
	return;
    }
    var videoURL = "https://www.youtube.com/watch?v=" + videoID;
    var videoStream = dl(videoURL);
    var converter = new ffmpeg({source : videoStream, timeout: 300})
	.withVideoBitrate(1024)
	.withAudioBitrate('128k')
	.toFormat('mp3')
	.writeToStream(res, function (retcode, err) {
	    if (err) {
		console.log("We had a stream error.");
	    }
	    else {
		// console.log("The conversion pipe succeeded!");
	    }
	    res.end();
	});
});
app.get('/', function (req, res) {
    var videoID = req.query.q;
    res.render("index", {"videoID" : videoID});
});

process.on('uncaughtException', function (err) {
    // handles the unexpected stream closure error...for now
});



app.listen(process.env.PORT || 8080);
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

process.on('uncaughtException', function (err) {
    // handles the unexpected stream closure error...for now
});

app.get("/favicon.ico", function (req, res) {
    res.sendfile("favicon.ico");
});

app.get('/videos/:videoID', function (req, res) {
    var videoID = req.params.videoID;
    if (videoID == "undefined") {
	res.send("Error!");
	return;
    }
    res.writeHead(200, {"Content-Type" : "audio/mpeg", "X-Content-Duration" : 92.6});
    var videoURL = "https://www.youtube.com/watch?v=" + videoID;
    var videoStream = dl(videoURL);
    var converter = new ffmpeg({source : videoStream, timeout: 300})
	.withVideoBitrate(1024)
	.withAudioBitrate('128k')
	.toFormat('mp3')
	.writeToStream(res, function (retcode, err) {
	    if (err) {
		console.log("The stream was unexpectedly closed.");
	    }
	    else {
		console.log("The conversion pipe succeeded!");
	    }
	    res.end();
	});
});
app.get('/', function (req, res) {
    var videoID = req.query.v;
    res.render("index", {"videoID" : videoID});
});

app.listen(process.env.PORT || 8080);
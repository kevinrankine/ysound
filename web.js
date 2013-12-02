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
    console.log(err.message);
});

app.get("/favicon.ico", function (req, res) {
    res.sendfile("favicon.ico");
});

app.get('/videos/:videoID', function (req, res) {
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
});
app.get('/', function (req, res) {
    var videoID = req.query.v;
    res.render("index", {"videoID" : videoID});
});

app.listen(process.env.PORT || 8080);
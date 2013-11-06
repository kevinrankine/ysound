#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var dl = require('ytdl');
var ffmpeg = require('fluent-ffmpeg');

app.get("/favicon.ico", function (req, res) {
    res.sendfile("favicon.ico");
});

app.get('/videos/:videoID', function (req, res) {
    var videoID = req.params.videoID;
    console.log(videoID);
    if (videoID == "undefined") {
	res.send("Error!");
	return;
    }
    var videoURL = "https://www.youtube.com/watch?v=" + videoID;
    try {
	var videoStream = dl(videoURL);
	var converter = new ffmpeg({source : videoStream, timeout: 3000})
	    .withVideoBitrate(1024)
	    .withAudioBitrate('128k')
	    .toFormat('mp3')
	    .writeToStream(res, function (retcode, err) {
		if (err) {
		    console.log(err);
		}
		else {
		    console.log("The conversion pipe succeeded!");
		}
		res.end();
		dl.cache = {};
	    });
    }
    catch(err) {
	console.log("Response failed!");
	res.send("Response failed!");
    }
});
app.get('/', function (req, res) {
    var videoID = req.query.q;
    res.send('<audio controls src=/videos/' + videoID + '></audio>');
});

app.listen(8080);
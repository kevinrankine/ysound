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
    var videoStream = dl(videoURL);
    /*
    video.pipe(res, { end : false});
    video.on('end', function (req, res) {
	res.end();
    }); 
    */
    var converter = new ffmpeg({source : videoStream}).toFormat('mp3').pipe(res, {end : false});
    converter.on('end', function() {
	res.end();
    });
    
});
app.get('/', function (req, res) {
    var videoID = req.query.q;
    res.send('<video controls width="100%" height="100%" src=/videos/' + videoID + '></video>');
});

app.listen(8080);
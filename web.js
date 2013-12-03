#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var dl = require('ytdl');
var ffmpeg = require('fluent-ffmpeg');
var rest = require("restler")
var cheerio = require("cheerio");
var cluster = require("cluster");
var numNodes = 5;
if (cluster.isMaster) {
    for(var i = 0; i < numNodes; i++) {
	cluster.fork();
    }
    cluster.on('disconnect', function(worker) {
	console.error('disconnect!');
	cluster.fork();
    });
    setInterval(function () {
	for(var i = 0; i < numNodes - cluster.workers.length; i++) {
	    cluster.fork();
	}
    }, 3000);
}
else {
    app.set("view engine", "jade");
    app.set("views", __dirname + "/views");
    app.use(express.static(__dirname + "/public"));

    app.get("/favicon.ico", function (req, res) {
	res.sendfile("favicon.ico");
    });

    app.get('/videos/:videoID', function (req, res) {
	var videoID = req.params.videoID;
	if (videoID == "undefined") {
	    res.send("Video ID is not valid.");
	    return;
	}
	res.writeHead(200, {"Content-Type" : "audio/mp3", "Content-Length" : 1000000 * 10});
	var videoURL = "https://www.youtube.com/watch?v=" + videoID;
	var videoStream = dl(videoURL);
	var converter = new ffmpeg({source : videoStream, timeout: 300})
	    .withVideoBitrate(1024)
	    .withAudioBitrate('128k')
	    .toFormat('mp3')
	    .writeToStream(res, function (retcode, err) {
		console.log(retcode);
		if (err) {
		    console.log("A pipe closed.");
		    res.end()
		}
		else {
		    console.log("The conversion pipe succeeded!");
		}
	    });
    });
    app.get('/watch', function (req, res) {
	var videoID = req.query.v;
	var searchQuery = req.query.q;

	if (videoID) {
	    res.render("index", {"videoID" : videoID});
	}
	else if (searchQuery) {
	    var listingURL = "http://youtube.com/results?search_query=";
	    listingURL += searchQuery.split(" ").join("+");
	    console.log("The listing url is ", listingURL);
	    
	    rest.get(listingURL).on("complete", function (data) {
		if (data instanceof Error) {
		    res.end("Couldn't load page.");
		    return;
		}
		$ = cheerio.load(data);
		var listingData = $("a.yt-uix-sessionlink.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2");
		res.render("index", {"listingData" : listingData});
	    });
	}
	else {
	    res.render("index");
	}
    });

    app.listen(process.env.PORT || 80);
}
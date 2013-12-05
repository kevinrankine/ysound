#!/usr/bin/env node

// the cluster module provides for creating several node worker processes in the event that one breaks down
var cluster = require("cluster");

/* 
   the number of nodes that is optimal depends heavily on the platform. I ran this code on a EC2 t1.micro instance
   so there wasn't much sense in using too many as each subprocess eats up the very limited memory
*/
var numNodes = 5;

if (cluster.isMaster) {
    for(var i = 0; i < numNodes; i++) {
	cluster.fork();
    }
    cluster.on("disconnect", function(worker) {
	console.error("A node disconnected.");
	cluster.fork(); 
    });
}
else {
    var http = require("http");
    var fs = require("fs");
    var express = require("express");
    var app = express();
    var dl = require("ytdl");
    var ffmpeg = require('fluent-ffmpeg');
    var rest = require("restler")
    var cheerio = require("cheerio");
    var domain = require("domain");
    
    // this selector is determined by youtube, and should be updated when changed (it refers to a link element leading to a video on the listing page
    var CSS_LINK_SELECTOR = "a.yt-uix-sessionlink.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2";
    
    app.set("view engine", "jade");
    app.set("views", __dirname + "/views");
    app.use(express.static(__dirname + "/public"));

    app.get('/videos/:videoID', function (req, res) {
	var videoID = req.params.videoID;
	if (videoID == "undefined") {
	    res.send("Video ID is not valid.");
	    return;
	}
	res.writeHead(200, {
	    "Content-Type" : "audio/mp3",
	    "Transfer-Encoding" : "chunked",
	    "Content-disposition" : "attachment; filename=" + videoID + ".mp3" 
	});
	
	var videoURL = "http://www.youtube.com/watch?v=" + videoID;
	var videoStream = dl(videoURL);
	var converter = new ffmpeg({source : videoStream, timeout: 30000})
	    .withVideoBitrate(1024)
	    .withAudioBitrate('128k')
	    .toFormat('mp3')
	    .writeToStream(res, function (retcode, err) {
		if (err) {
		    // do something
		}
		else {
		    // do something else
		}
	    }); 
    }); 
    app.get('/watch', function (req, res) {
	var videoID = req.query.v;
	var searchQuery = req.query.q;

	if (videoID) {
	    res.render("video", {"videoID" : videoID});
	}
	else if (searchQuery) {
	    var listingURL = "http://youtube.com/results?search_query=";
	    listingURL += searchQuery.split(" ").join("+");
	    
	    rest.get(listingURL).on("complete", function (data) {
		if (data instanceof Error) {
		    res.end("Couldn't load page.");
		    return;
		}
		$ = cheerio.load(data);
		var listingData = $(CSS_LINK_SELECTOR);
		res.render("list", {"listingData" : listingData});
	    });
	}
	else {
	    res.render("search");
	}
    });
    
    app.get("*", function (req, res) {
	res.send("The content you requested could not be found.", 404);
    });

    app.listen(process.env.PORT || 80);
}
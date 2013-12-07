#!/usr/bin/env node

// the cluster module provides for creating several node worker processes in the event that one breaks down 
var cluster = require("cluster");

/* 
   the number of nodes that is optimal depends heavily on the platform. I ran this code on a EC2 t1.micro instance and an m1.medium instance
   so there wasn't much sense in using too many as each subprocess eats up the very limited memory
*/
var numNodes = 5;

// if the current process is the master process
if (cluster.isMaster) {

    // spawn numNodes worker processes
    for(var i = 0; i < numNodes; i++) {
	cluster.fork();
    }

    // when a worker disconnects, report it, and create a replacement worker
    cluster.on("disconnect", function(worker) {
	console.error("A node disconnected.");
	cluster.fork(); 
    });
}
else {

    /*
      Import a bunch of required modules including,
      the standard NodeJS module for dealing with http
      express (the framework),
      ytdl (the youtube downloading module),
      fluent-ffmpeg (the NodeJS interface/wrapper for ffmpeg on the system),
      restler (the REST client library used for the search functionality),
      cheerio (used for parsing the html gathered by restler)
    */
    var http = require("http");
    var express = require("express");
    var dl = require("ytdl");
    var ffmpeg = require('fluent-ffmpeg');
    var rest = require("restler")
    var cheerio = require("cheerio");
    var domain = require("domain");
    
    // this selector is determined by youtube, and should be updated when changed (it refers to a link element leading to a video on the listing page)
    var CSS_LINK_SELECTOR = "a.yt-uix-sessionlink.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2";
    
    var app = express();
    
    // the templating language used is jade (http://jade-lang.com/) 
    app.set("view engine", "jade");

    // the views are contained in the views/ subdirectory
    app.set("views", __dirname + "/views");
    
    // use the 80 port
    app.set("PORT", 80);
    
    // static files (js and css) are in the public/ subdirectory
    app.use(express.static(__dirname + "/public"));
    
    // displays the home page
    app.get("/", function (req, res) {
	res.send("Go to <a href=\"/watch\">http://kevinrankine.com/watch</a>");
    });
    
    /*
      This function handles a GET request for the audio of a particular youtube video, specified by the videoID parameter (which is used by youtube).
      It sends headers indicating that the content to be received by the client is mp3 data, and using content disposition it suggests that the browser download the video (instead of trying to play it)
      It downloads the video to a stream and pipes this to an ffmpeg converter (interfaced by fluent-ffmpeg),  which converts the video to mp3 and pipes the mp3 data to the client.
      Because the conversion is done 'on the fly', the audio is received by the client much faster than if we wrote the video to disk, converted it, wrote the mp3 to disk, and served the file.
    */
    app.get('/videos/:videoID', function (req, res) {
	// the videoID parameter
	var videoID = req.params.videoID;
	
	// the url at which the requested video lives on youtube
	var videoURL = "http://www.youtube.com/watch?v=" + videoID;
	
	// start downloading the video here
	var videoStream = dl(videoURL);
	
	// send out the HTTP headers
	res.writeHead(200, {
	    "Content-Type" : "audio/mp3",
	    "Transfer-Encoding" : "chunked",
	    "Content-disposition" : "attachment; filename=" + videoID + ".mp3" 
	});

	// converts the video data to mp3
	// if there's an error, it logs it.
	var converter = new ffmpeg({source : videoStream, timeout: 30000})
	    .withVideoBitrate(512)
	    .withAudioBitrate('128k')
	    .toFormat('mp3')
	    .writeToStream(res, function (retcode, err) {
		console.log(err);
	    }); 
    }); 
    /*
      Three things are handled by this route/handler: search, listing the results of a search, and the playing of the audio of a video.
      If no GET parameters are present, a search interface is displayed (implemented in search.jade).
      If a 'q' parameter is present, corresponding to a a user's search, the restler library is used to get the youtube search results for that search,
      (if the page parameter is present, that page number of the results is collected) and the cheerio module is used to parse out the list of links, 
      which is then displayed using the view implementedby list.jade. If the 'v' parameter is present, corresponding the the ID of a youtube video, then 
      a view for playing the video is implemented by video.jade.
     */
    app.get('/watch', function (req, res) {
	// the ID of the video requested, if present
	var videoID = req.query.v;
	
	// the search query of the user, if present.
	var searchQuery = req.query.q;
	
	// the page number of results requested, if present.n
	var pageNumber = req.query.page;

	// if we got a a request for a youtube video, render a view containing an HTML5 audio element for playing the video
	if (videoID) {
	    res.render("video", {"videoID" : videoID});
	}
	
	// if the user searched for something, list out the search results
	else if (searchQuery) {

	    
	    // if the pageNumber paramter is not present, set it equal to 1
	    if (!pageNumber) {
		var pageNumber = 1;
	    }	    	    

	    // construct the search query URL
	    var listingURL = "http://youtube.com/results?search_query=";
	    listingURL += searchQuery.split(" ").join("+");
	    listingURL += "&page=" + pageNumber;
	    
	    // gets the video listing from youtube
	    rest.get(listingURL).on("complete", function (data) {
		// if there is an error in getting the data, kill it
		if (data instanceof Error) {
		    res.end("Couldn't load page.");
		    return;
		}
		
		// select out all the links on the search result page using cheerio
		$ = cheerio.load(data); 
		var listingData = $(CSS_LINK_SELECTOR);
		
		pageNumber++;
		
		res.render("list", {
		    "listingData" : listingData,
		    "nextPageUrl" : "/watch?q=" + searchQuery + "&page=" + pageNumber
		});
	    });
	}
	
	// if the user neither searched nor requested a particular video, just render the search.
	else {
	    res.render("search");
	}
    });
    
    /*
      Any URL that is not handled by the previous handlers is 404ed.
     */
    app.get("*", function (req, res) {
	res.send("The content you requested could not be found.", 404);
    });

    http.createServer(app).listen(app.get("PORT"));
}

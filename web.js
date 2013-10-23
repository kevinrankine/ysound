var http = require('http');
var fs = require('fs');

var videoIn = fs.createReadStream('videoIn.mp4');
var videoOut = fs.createWriteStream('videoOut.mp4')

videoIn.pipe(videoOut, {end : false});

http.createServer(function (req, res) {
    if (req.url === '/videoOut.mp4') {
	console.log("Started sending video!");
	fs.createReadStream('videoOut.mp4').pipe(res);
	console.log("Finished sending video!");
    }
    else {
	res.end(fs.readFileSync("index.html").toString('utf-8'));
    }
}).listen(8080);
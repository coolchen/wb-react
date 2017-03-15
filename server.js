var express = require('express'),
    app = express(),
	socket = require('socket.io'),
	http = require('http')

 
    // I extracted some logic to another file; more on that in a moment
    // webpackDevHelper = require('./index.dev.js');
 
// ...presumably lots of other stuff...
 
// we only want hot reloading in development
if (process.env.NODE_ENV !== 'production') {
    console.log('DEVOLOPMENT ENVIRONMENT: Turning on WebPack Middleware...');
    // webpackDevHelper.useWebpackMiddleware(app);
} else {
    console.log('PRODUCTION ENVIRONMENT');
 
    //Production needs physical files! (built via separate process)
    app.use('/', express.static(__dirname + '/client/build'));
	app.get("*", function(req, rsp) {
		rsp.sendFile('index.html', { root : __dirname + 'client/build'});
	})
}

app.get('/api/status', function(req, res) {
	res.send("status is OK!");
})


 
// ...presumably lots of other stuff...
 
// Start your express server as usual
// app.start(3000);

var server = http.createServer(app).listen(3001);

// LISTEN FOR REQUESTS
var io = socket.listen(server);
io.sockets.setMaxListeners(0);

io.sockets.on('connection', function (socket) {
	console.log("client connected!");
});
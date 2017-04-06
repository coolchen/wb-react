var settings = require('./util/Settings.js'),
    tests = require('./util/tests.js'),
    draw = require('./util/draw.js'),
    projects = require('./util/projects.js'),
    db = require('./util/db.js'),
	express = require('express'),
	paper = require('paper'),
    app = express(),
	socket = require('socket.io'),
	http = require('http'),
	jwt = require('jsonwebtoken');

 
    // I extracted some logic to another file; more on that in a moment
    // webpackDevHelper = require('./index.dev.js');
 
// ...presumably lots of other stuff...
 
// we only want hot reloading in development
if (process.env.NODE_ENV !== 'production') {
    console.log('DEVOLOPMENT ENVIRONMENT: Turning on WebPack Middleware...');
    // webpackDevHelper.useWebpackMiddleware(app);
	app.use('/uploaded', express.static(__dirname + '/client/uploaded'));
} else {
    console.log('PRODUCTION ENVIRONMENT');
 
    //Production needs physical files! (built via separate process)
    app.use('/', express.static(__dirname + '/client/build'));
	app.get("*", function(req, rsp) {
		rsp.sendFile('index.html', { root : __dirname + 'client/build'});
	})
}

app.get('/api/status', function(req, res) {
	// res.send("status is OK!");
	res.send("jwt is: " + req.query.jwt);
})

app.use('/login', express.static(__dirname + '/pseudoAuth'));

app.get('/pseudoAuth', function(req, res) {
	// res.send("status is OK!");
	var token = jwt.sign({
		user: req.query.uname,
		room: req.query.room
	}, 'secret');

	res.redirect("/api/status?jwt=" + token);
})
 
// ...presumably lots of other stuff...
 
// Start your express server as usual
// app.start(3000);

var server = http.createServer(app).listen(settings.port);

// LISTEN FOR REQUESTS
var io = socket.listen(server);
io.sockets.setMaxListeners(0);

io.sockets.on('connection', function (socket) {
	console.log("client connected!");

	socket.on('subscribe', function(data) {
		subscribe(socket, data);
	});

	socket.on('disconnect', function () {
		console.log("Socket disconnected");
		// TODO: We should have logic here to remove a drawing from memory as we did previously
	});

	// EVENT: User stops drawing something
	// Having room as a parameter is not good for secure rooms
	socket.on('draw:progress', function (room, uid, co_ordinates) {
		if (!projects.projects[room] || !projects.projects[room].project) {
			loadError(socket);
			return;
		}
		io.in(room).emit('draw:progress', uid, co_ordinates);
		draw.progressExternalPath(room, JSON.parse(co_ordinates), uid);
	});

	// EVENT: User stops drawing something
	// Having room as a parameter is not good for secure rooms
	socket.on('draw:end', function (room, uid, co_ordinates) {
		if (!projects.projects[room] || !projects.projects[room].project) {
			loadError(socket);
			return;
		}
		io.in(room).emit('draw:end', uid, co_ordinates);
		draw.endExternalPath(room, JSON.parse(co_ordinates), uid);
	});

	// User clears canvas
	socket.on('canvas:clear', function(room) {
		if (!projects.projects[room] || !projects.projects[room].project) {
			loadError(socket);
			return;
		}
		draw.clearCanvas(room);
		io.in(room).emit('canvas:clear');
	});

	// User adds a raster image
	socket.on('image:add', function(room, uid, data, position, name, scale) {
		draw.addImage(room, uid, data, position, name, scale);
		io.sockets.in(room).emit('image:add', uid, data, position, name, scale);
	});

	socket.on('draw:changePage', function(room, uid, prev, next) {
		draw.changePage(room, uid, prev, next);
		io.sockets.in(room).emit('draw:changePage', uid, prev, next);
	});

});

// Subscribe a client to a room
function subscribe(socket, data) {
  var room = data.room;

  // Subscribe the client to the room
  socket.join(room);

  // If the close timer is set, cancel it
  // if (closeTimer[room]) {
  //  clearTimeout(closeTimer[room]);
  // }

  // Create Paperjs instance for this room if it doesn't exist
  var project = projects.projects[room];
  if (!project) {
    console.log("made room");
    projects.projects[room] = {};
    // Use the view from the default project. This project is the default
    // one created when paper is instantiated. Nothing is ever written to
    // this project as each room has its own project. We share the View
    // object but that just helps it "draw" stuff to the invisible server
    // canvas.
    projects.projects[room].project = new paper.Project();
    projects.projects[room].external_paths = {};
    db.load(room, socket);
  } else { // Project exists in memory, no need to load from database
    loadFromMemory(room, socket);
  }

  // Broadcast to room the new user count -- currently broken
  var rooms = socket.adapter.rooms[room]; 
  var roomUserCount = Object.keys(rooms).length;
  io.to(room).emit('user:connect', roomUserCount);
}

var clientSettings = {
  "tool": settings.tool
}

// Send current project to new client
function loadFromMemory(room, socket) {
  var project = projects.projects[room].project;
  if (!project) { // Additional backup check, just in case
    db.load(room, socket);
    return;
  }
  socket.emit('loading:start');
  var value = project.exportJSON();
  socket.emit('project:load', {project: value});
  socket.emit('settings', clientSettings);
  socket.emit('loading:end');
}

function loadError(socket) {
  socket.emit('project:load:error');
}

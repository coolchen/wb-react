var settings = require('./Settings.js'),
    projects = require('./projects.js'),
     ueberDB = require('ueberDB')

// Database connection
var db = new ueberDB.database(settings.dbType, settings.dbSettings);

// Init..
db.init(function(err){
  if(err){
    console.error(err);
  }
});

// Write to teh database
exports.storeProject = function(room) {
  var project = projects.projects[room].project.paperProject;
  var json = project.exportJSON();
  var roomJson = {
    pdfFile: projects.projects[room].project.pdfFile,
    paperProject: json
  };
  console.log("Writing project to database");
  db.set(room, roomJson);
}

// Try to load room from database
exports.load = function(room, socket) {
  console.log("load from db");
  if (projects.projects[room] && projects.projects[room].project.paperProject) {
    var project = projects.projects[room].project.paperProject;
    db.get(room, function(err, value) {
      if (value && project && project.activeLayer) {
        socket.emit('loading:start');
        // Clear default layer as importing JSON adds a new layer.
        // We want the project to always only have one layer.
        project.activeLayer.remove();
        project.importJSON(value.paperProject);
        socket.emit('project:load', value);
      }
      socket.emit('loading:end');
    });
    socket.emit('loading:end'); // used for sending back a blank database in case we try to load from DB but no project exists
  } else {
    // loadError(socket);
    socket.emit('project:load:error');
  }
}

exports.db = db;

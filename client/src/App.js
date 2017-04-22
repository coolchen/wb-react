import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import AppBar from 'react-toolbox/lib/app_bar/AppBar';
import Navigation from 'react-toolbox/lib/navigation/Navigation';
import Link from 'react-toolbox/lib/link/Link';
import Dialog from 'react-toolbox/lib/dialog/Dialog';
import Button from 'react-toolbox/lib/button/Button';

import Dropzone from 'react-dropzone';
import io from 'socket.io-client';
import cookie from 'react-cookie';
import request from 'superagent';

import ContentView from './ContentView.js';

class App extends Component {

  state = {
    active: false,
    // pdfFile: "/uploaded/GPU_HowThingsWork.pdf"
  }

	// Random User ID
	// Used when sending data
	uid = (function() {
		var S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	}());

  jwtParam = location.search.split('jwt=')[1]

  papers = []
  contentViews = []
  room = "1";
  // Initialise Socket.io
  // var base_path = /(\/.+)?\/d\/.*/.exec(window.location.pathname)[1] || '/';
  // var socket = io.connect({ path: base_path + "socket.io"});
  socket = io.connect({ path: "/socket.io"});

  registerPaperInstance(pid, paper){
    this.papers.push(paper);
    // this.setupWebSocketConnection();
  }

  // TODO: use reactive to replace this kind of register
  registerContentView(pid, contentView) {
    this.contentViews.push(contentView);
  }

  unregisterPaperInstance(pid) {

  }

  setupWebSocketConnection = () =>{
    var papers = this.papers;
    var room = this.room;
    var socket = this.socket;
    var uid = this.uid;
    var jwtParam = this.jwtParam;
    var contentViews = this.contentViews;

		// Join the room
		socket.emit('subscribe', {
			jwt: jwtParam
		});

		socket.on('project:load', function(json) {
			// console.log("project:load");
			// paper.project.activeLayer.remove();
			// paper.project.importJSON(json.project);

			// paper.view.draw();
      var paper = papers[0];
      paper.loadProject(json);
		});

		socket.on('draw:progress', (artist, data) => {
			// It wasnt this user who created the event
      var paper = papers[0];
			if (artist !== this.uid && data) {
				paper.progress_external_path(JSON.parse(data), artist);
			}
		});

		socket.on('draw:end', (artist, data) => {
      var paper = papers[0];
			// It wasnt this user who created the event
			if (artist !== this.uid && data) {
				paper.end_external_path(JSON.parse(data), artist);
			}
		});

    socket.on('image:add', function(artist, data, position, name, scale) {
      var paper = papers[0];
      if (artist != uid) {
        paper.onImageAdded(data, position, name, scale);
      }
    });

    socket.on('canvas:clear', () => {
      var paper = papers[0];
      paper.clearCanvas();
      this.setState({
        pdfFile: null
      });
    });

    socket.on('pdf:added', (artist, fileName) => {
			// It wasnt this user who created the event
      this.setState({pdfFile: fileName});
		});

    socket.on('draw:changePage', function (artist, oldPage, newPage) {
      var contentView = contentViews[0];
      contentView.changePage(newPage);
    });
  }

  handleToggle = () => {
    this.setState({active: !this.state.active});
  }

  clearProject = () => {
    this.socket.emit('canvas:clear', this.room);
  }

  actions = [
    { label: "Cancel", onClick: this.handleToggle },
    { label: "Save", onClick: this.handleToggle }
  ];

  onDrop = (files) => {
    console.log('Received files: ', files);
    var paper = this.papers[0];
    if(files[0].type == "application/pdf") {
      request
        .post('/upload')
        .attach('file', files[0])
        .end(() => {
          console.log("upload sucessfully!");
          var fileName = '/uploads/' + files[0].name;
          this.setState({pdfFile: fileName});
          this.socket.emit('canvas:clear', this.room);
          this.socket.emit('pdf:added', this.room, this.uid, fileName);
        });
    } else {
      paper.uploadImage(files[0]);
    }


    this.handleToggle();
  }

  componentDidMount() {
    console.log("App component did mount!");
    console.log("jwt is: " + this.jwtParam);
    cookie.save('jwt', this.jwtParam, { path: '/' });
    this.setupWebSocketConnection();
  }

  render() {
    return (
      <div className="App"> 
        <div className="Side-Bar">
          <Button icon='border_color' floating inverse />
          <Button icon='picture_as_pdf' floating inverse onClick={this.handleToggle} />
          <Button icon='photo_library' floating inverse onClick={this.handleToggle} />
          <Button icon='delete_forever' floating inverse onClick={this.clearProject} />
        </div>
        <div className="Content-Wrapper">
          <ContentView viewID="view1" reg={this.registerPaperInstance.bind(this)} socket={this.socket} 
            regContentView={this.registerContentView.bind(this)} room={this.room} 
            uid={this.uid} pdfFile={this.state.pdfFile}/>
        </div>
        <Dialog
          actions={this.actions}
          active={this.state.active}
          onEscKeyDown={this.handleToggle}
          onOverlayClick={this.handleToggle}
          title='Upload File'
        >
            <Dropzone onDrop={this.onDrop} multiple={false}>
              <div className="Upload-Hint-Message">Try dropping some files here, or click to select files to upload.</div>
            </Dropzone>
        </Dialog>
      </div>
    );
  }
}

export default App;

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

import ContentView from './ContentView.js';

class App extends Component {

  state = {
    active: false
  }

  papers = []
  room = "1";
  // Initialise Socket.io
  // var base_path = /(\/.+)?\/d\/.*/.exec(window.location.pathname)[1] || '/';
  // var socket = io.connect({ path: base_path + "socket.io"});
  socket = io.connect({ path: "/socket.io"});

  registerPaperInstance(pid, paper){
    this.papers.push(paper);
    // this.setupWebSocketConnection();
  }

  unregisterPaperInstance(uid) {

  }

  setupWebSocketConnection = () =>{
    var papers = this.papers;
    var room = this.room;
    var socket = this.socket;

		// Join the room
		socket.emit('subscribe', {
			room: room
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
  }

  handleToggle = () => {
    this.setState({active: !this.state.active});
  }

  actions = [
    { label: "Cancel", onClick: this.handleToggle },
    { label: "Save", onClick: this.handleToggle }
  ];

  onDrop(files) {
    console.log('Received files: ', files);
  }

  componentDidMount() {
    console.log("App component did mount!");
    this.setupWebSocketConnection();
  }

  render() {
    return (
      <div className="App"> 
        <div className="Side-Bar">
          <Button icon='border_color' floating inverse />
          <Button icon='picture_as_pdf' floating inverse onClick={this.handleToggle}/>
        </div>
        <div className="Content-Wrapper">
          <ContentView viewID="view1" reg={this.registerPaperInstance.bind(this)} socket={this.socket} 
            room={this.room}/>
        </div>
        <Dialog
          actions={this.actions}
          active={this.state.active}
          onEscKeyDown={this.handleToggle}
          onOverlayClick={this.handleToggle}
          title='上传图片'
        >
            <Dropzone onDrop={this.onDrop}>
              <div>Try dropping some files here, or click to select files to upload.</div>
            </Dropzone>
        </Dialog>
      </div>
    );
  }
}

export default App;

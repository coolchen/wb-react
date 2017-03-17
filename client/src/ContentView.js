import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
import io from 'socket.io-client';
import './ContentView.css';

class ContentView extends Component {
	constructor(props) {
		super(props);
		this.state = this.calculateNewSize(props.containerWidth, props.containerHeight);
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		// if (nextProps.startTime !== this.state.startTime) {
		// 	this.setState({ startTime: nextProps.startTime });
		// }
		console.log("container size changed!");
		console.log(nextProps);
		if(nextProps.containerWidth !== this.props.containerWidth ||
			nextProps.containerHeight !== this.props.containerHeight) 
		{
			this.setState(this.calculateNewSize(nextProps.containerWidth, nextProps.containerHeight));
		}
	}

	calculateNewSize(containerWidth, containerHeight) {
		var w, h;
		if(containerWidth*9 > containerHeight*16) {
			w = containerHeight*16/9;
			h = containerHeight;
		}
		else {
			w = containerWidth;
			h = containerWidth*9/16;
		}

		return {
			newWidth: w,
			newHeight: h
		}
	}

	canvasStyle = {
		color: 'blue',
	};

	// Random User ID
	// Used when sending data
	uid = (function() {
		var S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	}());

	external_paths = {};

	progress_external_path = (points, artist) => {
		var paper = this.paper;
		paper.activate();
		var external_paths = this.external_paths;
		var path = external_paths[artist];

		// The path hasnt already been started
		// So start it
		if (!path) {

			// Creates the path in an easy to access way
			external_paths[artist] = new paper.Path();
			path = external_paths[artist];

			// Starts the path
			var start_point = new paper.Point(points.start[1], points.start[2]);
			var color = new paper.Color(0, 0, 0, 1);

			path.strokeColor = color;
			path.strokeWidth = 2;

			path.name = points.name;
			path.add(start_point);

		}

		// Draw all the points along the length of the path
		var paths = points.path;
		var length = paths.length;
		for (var i = 0; i < length; i++) {

			path.add(new paper.Point(paths[i].top[1], paths[i].top[2]));
			path.insert(0, new paper.Point(paths[i].bottom[1], paths[i].bottom[2]));

		}

		path.smooth();
		paper.view.draw();
	};

	end_external_path = (points, artist) => {
		var paper = this.paper;
		paper.activate();
		var external_paths = this.external_paths;

		var path = external_paths[artist];

		if (path) {

			// Close the path
			path.add(new paper.Point(points.end[1], points.end[2]));
			path.closed = true;
			path.smooth();
			paper.view.draw();

			// Remove the old data
			external_paths[artist] = false;

		}
	};


	componentDidMount() {
        // Instantiate the paperScope with the canvas element
        var myCanvas = document.getElementById(this.props.viewID);
		// var paper = window.paper;
		var paper = new window.paper.PaperScope();
		this.paper = paper;
        paper.setup(myCanvas);
		console.log("view center is " + paper.view.center);
		paper.view.viewSize = [this.state.newWidth, this.state.newHeight];
		
		var s = this.state.newHeight / 720;

		var transformMatrix = new paper.Matrix(s, 0, 0, s, 0, 0);
		paper.view.transform(transformMatrix);

		var room = "1";
		// Initialise Socket.io
		// var base_path = /(\/.+)?\/d\/.*/.exec(window.location.pathname)[1] || '/';
		// var socket = io.connect({ path: base_path + "socket.io"});
		var socket = io.connect({ path: "/socket.io"});

		// Join the room
		socket.emit('subscribe', {
			room: room
		});

		socket.on('project:load', function(json) {
			console.log("project:load");
			paper.project.activeLayer.remove();
			paper.project.importJSON(json.project);

			paper.view.draw();
		});

		socket.on('draw:progress', (artist, data) => {
			// It wasnt this user who created the event
			if (artist !== this.uid && data) {
				this.progress_external_path(JSON.parse(data), artist);
			}
		});

		socket.on('draw:end', (artist, data) => {
			// It wasnt this user who created the event
			if (artist !== this.uid && data) {
				this.end_external_path(JSON.parse(data), artist);
			}
		});

		// JSON data ofthe users current drawing
		// Is sent to the user
		var path_to_send = {};
		var paper_object_count = 0;

		var tool = new paper.Tool();
		var path;

		var active_color_rgb = new paper.Color(0, 0, 0, 1);
		active_color_rgb._alpha = 1;
		var active_color_json = {
			"red": 0,
			"green": 0,
			"blue": 0,
			"opacity": 1
		};

		// Define a mousedown and mousedrag handler
		tool.onMouseDown = function(event) {
			// Ignore middle or right mouse button clicks for now
			if (event.event.button === 1 || event.event.button === 2) {
				return;
			}

			path = new paper.Path();
			path.strokeColor = active_color_rgb;
			path.strokeWidth = 2;
			path.name = this.uid + ":" + (++paper_object_count);
			path.add(event.point);

			// The data we will send every 100ms on mouse drag
			path_to_send = {
				name: path.name,
				rgba: active_color_json,
				start: event.point,
				path: [],
				tool: "pencil"
			};

		}

		tool.onMouseDrag = function(event) {
			// Ignore middle or right mouse button clicks for now
			if (event.event.button === 1 || event.event.button === 2) {
				return;
			}

			path.add(event.point);
			path.insert(0, event.point);
			path.smooth();
			console.log("mouse drag at " + event.point);

			// Add data to path
			path_to_send.path.push({
				top: event.point,
				bottom: event.point
			});
		}

		tool.onMouseUp = function(event) {
			path.add(event.point);
			console.log("mouse drag at " + event.point);

			path.closed = true;
			path.smooth();

			// Send the path to other users
			path_to_send.end = event.point;
			// This covers the case where paths are created in less than 100 seconds
			// it does add a duplicate segment, but that is okay for now.
			socket.emit('draw:progress', room, this.uid, JSON.stringify(path_to_send));
			socket.emit('draw:end', room, this.uid, JSON.stringify(path_to_send));
		}

    }

	buttonClicked() {
		var paper = this.paper;
		paper.activate();

		var width = paper.view.size.width;
        var height = paper.view.size.height;
        var circle = new paper.Shape.Circle({
            center: [width / 4, height / 4],
            fillColor: 'grey',
            radius: 10
        });
        
        // render
        paper.view.draw();

	}

	componentDidUpdate(prevProps, prevState) {
		var paper = this.paper;
		paper.activate();

		var s = this.state.newHeight / 720;
		var sr = s / paper.view.scaling.x;
		console.log("original scaling is:" + paper.view.scaling);
		console.log("scale to " + sr);
		paper.view.viewSize = [this.state.newWidth, this.state.newHeight];

		var transformMatrix = new paper.Matrix(sr, 0, 0, sr, 0, 0);
		paper.view.transform(transformMatrix);

		paper.view.draw();
	}

	render() {
		return (
			<div width={this.state.newWidth} height={this.state.newHeight}>
				<canvas id={this.props.viewID} className="ContentCanvas" ref={this.props.viewID}
					/>
				<button onClick={this.buttonClicked.bind(this)}>Add new circle</button>
			</div>
		)
	}
}

export default Dimensions()(ContentView);
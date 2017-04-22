import React, { Component } from 'react';
// import Dimensions from 'react-dimensions';
import io from 'socket.io-client';
// import ReactPDF from 'react-pdf';
import './ContentView.css';

class PaperLayer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			styles: this.getNewStyle(this.props.canvasSize)
		};
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		// if (nextProps.startTime !== this.state.startTime) {
		// 	this.setState({ startTime: nextProps.startTime });
		// }
		console.log("container size changed!");
		console.log(nextProps);
		// if(nextProps.canvasSize.startY !== this.props.canvasSize.startY ||
		// 	nextProps.canvasSize.startX !== this.props.canvasSize.startX ||
		// 	nextProps.canvasSize.newWidth !== this.props.canvasSize.newWidth ||
		// 	nextProps.canvasSize.newHeight !== this.props.canvasSize.newHeight) 
		{
			this.setState({
				styles: this.getNewStyle(nextProps.canvasSize)
			});
			// this.setState(this.calculateNewPdfSize(nextProps.containerWidth, nextProps.containerHeight, 
			// 				this.pdfWidth, this.pdfHeight));
		}

		if(nextProps.page !== this.props.page) {
			this.changePage(this.props.page, nextProps.page);
		}
	}

	getNewStyle(canvasSize) {
		return {
			top: canvasSize.startY + "px",
			left: canvasSize.startX + "px",
			width: canvasSize.newWidth + "px",
			height: canvasSize.newHeight + "px",
			position: "absolute",
			zIndex: "3"
		};
	}

	changePage = (prev, next) => {
		var paper = this.paper;
		paper.activate();

		console.log("current number of layer:" + paper.project.layers.length);
		paper.project.activeLayer.visible = false;
		if(paper.project.layers.length <= next) {
			var newLayer = new paper.Layer();
			newLayer.activate();
		} else {
			paper.project.layers[next].visible = true;
			paper.project.layers[next].activate();
		}
		// paper.project.activeLayer.visible = false;
	}

	// calculateNewSize(containerWidth, containerHeight) {
	// 	var w, h, x, y;
	// 	if(containerWidth*9 > containerHeight*16) {
	// 		w = containerHeight*16/9;
	// 		h = containerHeight;
	// 		x = (containerWidth - w)/2;
	// 		y = 0;
	// 	}
	// 	else {
	// 		w = containerWidth;
	// 		h = containerWidth*9/16;
	// 		x = 0;
	// 		y = (containerHeight - h)/2;
	// 	}

	// 	var styles = {
	// 		top: y + "px",
	// 		left: x + "px",
	// 		position: "absolute",
	// 		zIndex: "2"
	// 	};

	// 	return {
	// 		newWidth: w,
	// 		newHeight: h,
	// 		startX: x,
	// 		startY: y,
	// 		styles: styles
	// 	}
	// }

	pathParas = {
		paper_object_count: 0
	}

	registerPapers() {
		var external_paths = {};
		var paper = this.paper;
		var parthParas = this.pathParas;
		var uid = this.props.uid;
		var socket = this.props.socket;
		var room = this.props.room;

		var loadProject = function(json) {
			console.log("project:load");
			paper.activate();
			paper.project.activeLayer.remove();
			paper.project.importJSON(json);

			for(var i=0; i<paper.project.layers.length; i++) {
				if(i == 0) {
					paper.project.layers[i].visible = true;
					paper.project.layers[i].activate();
				} else {
					paper.project.layers[i].visible = false;
				}
			}

			paper.view.draw();
		};

		var progress_external_path = function(points, artist) {
			paper.activate();
			// var external_paths = this.external_paths;
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

		var end_external_path = function(points, artist){
			// var paper = this.paper;
			paper.activate();
			// var external_paths = this.external_paths;

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

		function uploadImage(file) {
			var reader = new FileReader();

			//attach event handler
			reader.readAsDataURL(file);
			reader.addEventListener('loadend', function(e) {
				paper.activate();
				var bin = this.result;

				//Add to paper project here
				var raster = new paper.Raster(bin);

				raster.onLoad = function() {
					raster.position = paper.view.center;

					var scaleX = 1280 / raster.width;
					var scaleY = 720 / raster.height;
					var s = scaleX < scaleY ? scaleX : scaleY;
					raster.scale(s);

					raster.name = uid + ":" + (++parthParas.paper_object_count);
					socket.emit('image:add', room, uid, JSON.stringify(bin), raster.position, raster.name, s);
				}
			});
		};
		
		function onImageAdded(data, position, name, scale) {
			paper.activate();

			var image = JSON.parse(data);
			var raster = new paper.Raster(image);
			raster.position = new paper.Point(position[1], position[2]);
			raster.scale(scale);
			raster.name = name;
			paper.view.draw();
		}

		function clearCanvas() {
			paper.activate();
			var project = paper.project;

			// Remove all but the active layer
			if (project.layers.length > 1) {
				var activeLayerID = project.activeLayer._id;
				for (var i = 0; i < project.layers.length; i++) {
					if (project.layers[i]._id != activeLayerID) {
						project.layers[i].remove();
						i--;
					}
				}
			}

			// Remove all of the children from the active layer
			if (paper.project.activeLayer && paper.project.activeLayer.hasChildren()) {
				paper.project.activeLayer.removeChildren();
			}
			paper.view.draw();
		}

		var cb = {
			loadProject: loadProject,
			end_external_path: end_external_path,
			progress_external_path: progress_external_path,
			uploadImage: uploadImage,
			onImageAdded: onImageAdded,
			clearCanvas: clearCanvas
		}

		this.props.reg("1", cb);
	}




	componentDidMount() {
		console.log("content view did mount!");

        // Instantiate the paperScope with the canvas element
        var myCanvas = document.getElementById(this.props.viewID);
		// var paper = window.paper;
		var paper = new window.paper.PaperScope();
		this.paper = paper;
        paper.setup(myCanvas);
		console.log("view center is " + paper.view.center);
		paper.view.viewSize = [this.props.canvasSize.newWidth, this.props.canvasSize.newHeight];
		
		var s = this.props.canvasSize.newHeight / 720;

		var transformMatrix = new paper.Matrix(s, 0, 0, s, 0, 0);
		paper.view.transform(transformMatrix);

		this.registerPapers();

		// var room = "1";
		// // Initialise Socket.io
		// // var base_path = /(\/.+)?\/d\/.*/.exec(window.location.pathname)[1] || '/';
		// // var socket = io.connect({ path: base_path + "socket.io"});
		// var socket = io.connect({ path: "/socket.io"});

		// // Join the room
		// socket.emit('subscribe', {
		// 	room: room
		// });

		// socket.on('project:load', function(json) {
		// 	console.log("project:load");
		// 	paper.project.activeLayer.remove();
		// 	paper.project.importJSON(json.project);

		// 	paper.view.draw();
		// });

		// socket.on('draw:progress', (artist, data) => {
		// 	// It wasnt this user who created the event
		// 	if (artist !== this.uid && data) {
		// 		this.progress_external_path(JSON.parse(data), artist);
		// 	}
		// });

		// socket.on('draw:end', (artist, data) => {
		// 	// It wasnt this user who created the event
		// 	if (artist !== this.uid && data) {
		// 		this.end_external_path(JSON.parse(data), artist);
		// 	}
		// });
		var socket = this.props.socket;
		var room = this.props.room;

		// JSON data ofthe users current drawing
		// Is sent to the user
		var path_to_send = {};
		// var paper_object_count = 0;
		var pathParas = this.pathParas;
		var uid = this.props.uid;

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
			path.name = this.uid + ":" + (++pathParas.paper_object_count);
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

	// buttonClicked() {
	// 	var paper = this.paper;
	// 	paper.activate();

	// 	var width = paper.view.size.width;
    //     var height = paper.view.size.height;
    //     var circle = new paper.Shape.Circle({
    //         center: [width / 4, height / 4],
    //         fillColor: 'grey',
    //         radius: 10
    //     });
        
    //     // render
    //     paper.view.draw();

	// }

	componentDidUpdate(prevProps, prevState) {
		var paper = this.paper;
		paper.activate();

		var s = this.props.canvasSize.newHeight / 720;
		var sr = s / paper.view.scaling.x;
		console.log("original scaling is:" + paper.view.scaling);
		console.log("scale to " + sr);
		paper.view.viewSize = [this.props.canvasSize.newWidth, this.props.canvasSize.newHeight];

		var transformMatrix = new paper.Matrix(sr, 0, 0, sr, 0, 0);
		paper.view.transform(transformMatrix);

		paper.view.draw();
	}

	render() {
		return (
			<div style={this.state.styles} className="PaperLayer">
				<canvas id={this.props.viewID} ref={this.props.viewID} className="PaperCanvas"/>
			</div>
		)
	}
}

export default PaperLayer;
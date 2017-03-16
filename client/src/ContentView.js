import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
import io from 'socket.io-client';
import './ContentView.css';

class ContentView extends Component {
	constructor(props) {
		super(props);
		this.state = this.calculateNewSize(props.containerWidth, props.containerHeight);

		var room = "1";
		// Initialise Socket.io
		// var base_path = /(\/.+)?\/d\/.*/.exec(window.location.pathname)[1] || '/';
		// var socket = io.connect({ path: base_path + "socket.io"});
		var socket = io.connect({ path: "/socket.io"});
		// Join the room
		socket.emit('subscribe', {
			room: room
		});
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

	componentDidMount() {
        // Instantiate the paperScope with the canvas element
        var myCanvas = document.getElementById(this.props.viewID);
		// var paper = window.paper;
		var paper = new window.paper.PaperScope();
		this.paper = paper;
        paper.setup(myCanvas);
		console.log("view center is " + paper.view.center);
		// paper.view.size.set(1280, 720);
		paper.view.viewSize = [this.state.newWidth, this.state.newHeight];
		
		var s = this.state.newHeight / 720;
		var newCenter = new paper.Point(this.state.newWidth/2, this.state.newHeight/2);
		newCenter = new paper.Point(1280/2, 720/2);
		paper.view.scale(s);

		// remove width and height propery in style, otherwise the canvas cannot be resized
		// var oldStyle = this.refs[this.props.viewID].style;
		// var newStyle;
		// for (var propertyName in oldStyle) {
		// 	//document.writeln( propertyName + " : " + myObject[propertyName] );
		// 	if(propertyName !== "width" || propertyName != "height")
		// 	{
		// 		newStyle[propertyName] = oldStyle[propertyName];
		// 	}
		// }
		// this.refs[this.props.viewID].style = newStyle;

		var tool = new paper.Tool();
		var path;

		// Define a mousedown and mousedrag handler
		tool.onMouseDown = function(event) {
			path = new paper.Path();
			path.strokeColor = 'black';
			path.add(event.point);
		}

		tool.onMouseDrag = function(event) {
			path.add(event.point);
			console.log("mouse drag at " + event.point);
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
		//paper.view.scale(s);
		//paper.view.zoom = s;
		var sr = s / paper.view.scaling.x;
		console.log("view center is " + paper.view.center);
		console.log("original scaling is:" + paper.view.scaling);
		console.log("scale to " + sr);
		// var newCenter = new paper.Point(this.state.newWidth/2, this.state.newHeight/2);
		// paper.view.size.set(1280, 720);
		paper.view.viewSize = [this.state.newWidth, this.state.newHeight];
		var newCenter = new paper.Point(1280/2, 720/2);
		paper.view.scale(sr);

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
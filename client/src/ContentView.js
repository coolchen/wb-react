import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
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
			newWidth: w+'px',
			newHeight: h+'px'
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
		
	}

	render() {
		return (
			<div width={this.state.newWidth} height={this.state.newHeight}>
				<canvas id={this.props.viewID} className="ContentCanvas" 
					width={this.state.newWidth} height={this.state.newHeight} style={this.canvasStyle} />
				<button onClick={this.buttonClicked.bind(this)}>Add new circle</button>
			</div>
		)
	}
}

export default Dimensions()(ContentView);
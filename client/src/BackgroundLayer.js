import React, { Component } from 'react';
import './ContentView.css';

class BackgroundLayer extends Component {
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
	}

	getNewStyle(canvasSize) {
		return {
			top: canvasSize.startY + "px",
			left: canvasSize.startX + "px",
			width: canvasSize.newWidth + "px",
			height: canvasSize.newHeight + "px",
			position: "absolute",
			zIndex: "1"
		};
	}

	render() {
		return (
			<div style={this.state.styles} className="BackgroundLayer">
			</div>
		)
	}
}

export default BackgroundLayer;
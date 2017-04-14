import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
import Button from 'react-toolbox/lib/button/Button';

import PaperLayer from './PaperLayer.js'
import PdfLayer from './PdfLayer.js'
import BackgroundLayer from './BackgroundLayer.js'

class ContentView extends Component {
	constructor(props) {
		super(props);
		// this.state = this.calculateNewSize(props.containerWidth, props.containerHeight);
		this.state = {
			pageIndex: 0,
			pageNumber: 1,
			canvasSize: this.calculateNewSize(this.props.containerWidth, this.props.containerHeight * 0.95)
		}
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		// if (nextProps.startTime !== this.state.startTime) {
		// 	this.setState({ startTime: nextProps.startTime });
		// }
		console.log("container size changed!");
		console.log(nextProps);
		// if(nextProps.containerWidth !== this.props.containerWidth ||
		// 	nextProps.containerHeight !== this.props.containerHeight) 
		{
			this.setState({
				canvasSize: this.calculateNewSize(nextProps.containerWidth, nextProps.containerHeight * 0.95)
			});
			// this.setState(this.calculateNewPdfSize(nextProps.containerWidth, nextProps.containerHeight, 
			// 				this.pdfWidth, this.pdfHeight));
		}

		if(!nextProps.pdfFile || 0 == nextProps.pdfFile.length) {
			this.setState({
				pageIndex : 0,
				pageNumber: 1
			});
		}
	}


	calculateNewSize(containerWidth, containerHeight) {
		var w, h, x, y;
		if(containerWidth*9 > containerHeight*16) {
			w = containerHeight*16/9;
			h = containerHeight;
			x = (containerWidth - w)/2;
			y = 0;
		}
		else {
			w = containerWidth;
			h = containerWidth*9/16;
			x = 0;
			y = (containerHeight - h)/2;
		}

		// var styles = {
		// 	top: y + "px",
		// 	left: x + "px",
		// 	position: "absolute",
		// 	zIndex: "2"
		// };

		return {
			newWidth: w,
			newHeight: h,
			startX: x,
			startY: y
		}
	}

	componentDidMount() {
		this.props.regContentView(1, {
			changePage: this.changePage
		});
	}

	changePage = (newPage) => {
		this.setState({
			pageIndex: newPage
		});
	}

	nextPage = () => {
		var oldPage = this.state.pageIndex;
		var newPage = this.state.pageIndex + 1;
		if(newPage >= this.state.pageNumber)
		{
			newPage = this.state.pageNumber - 1;
		}
		this.setState({
			pageIndex: newPage
		});

		this.props.socket.emit('draw:changePage', this.props.room, this.uid, oldPage, newPage);
	}

	prevPage = () => {
		var oldPage = this.state.pageIndex;
		var newPage = this.state.pageIndex - 1;
		if(newPage < 0)
		{
			newPage = 0;
		}
		this.setState({
			pageIndex: newPage
		});

		this.props.socket.emit('draw:changePage', this.props.room, this.uid, oldPage, newPage);
	}

	setPageNumberAndIndex = (number, index) => {
		this.setState({
			pageNumber: number,
			pageIndex: index
		});
	}

	render() {
		return (
			<div className="ContentView">
				<div className="ContentAera">
					<PdfLayer viewID={this.props.viewID} 
						room={this.props.room} uid={this.props.uid} page={this.state.pageIndex} 
						canvasSize={this.state.canvasSize} pdfFile={this.props.pdfFile} 
						setPageNumIndex={this.setPageNumberAndIndex} zIndex={2} />
					<PaperLayer viewID={this.props.viewID} reg={this.props.reg} socket={this.props.socket} 
						room={this.props.room} uid={this.props.uid} canvasSize={this.state.canvasSize}
						page={this.state.pageIndex} zIndex={3} />
					<BackgroundLayer viewID={this.props.viewID} canvasSize={this.state.canvasSize}
						zIndex={1} />
				</div>
				<div className="ContentToolBar">
					<Button icon='keyboard_arrow_left' inverse mini onClick={this.prevPage}/>
					<span>{this.state.pageIndex + 1} / {this.state.pageNumber} </span>
					<Button icon='keyboard_arrow_right' inverse mini onClick={this.nextPage}/>
				</div>
			</div>
		)
	}
}

export default Dimensions()(ContentView);
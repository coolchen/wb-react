import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
import Button from 'react-toolbox/lib/button/Button';

import PaperLayer from './PaperLayer.js'

class ContentView extends Component {
	constructor(props) {
		super(props);
		// this.state = this.calculateNewSize(props.containerWidth, props.containerHeight);
		this.state = {
			page: 0
		}
	}

	changePage = () => {
		var newPage = this.state.page + 1;
		this.setState({
			page: newPage
		});
	}

	render() {
		return (
			<div className="ContentView">
				<div className="ContentAera">
					<PaperLayer viewID={this.props.viewID} reg={this.props.reg} socket={this.props.socket} 
						room={this.props.room} uid={this.props.uid} page={this.state.page}/>
				</div>
				<div className="ContentToolBar">
					<Button icon='delete_forever' floating inverse mini onClick={this.changePage}/>
				</div>
			</div>
		)
	}
}

export default Dimensions()(ContentView);
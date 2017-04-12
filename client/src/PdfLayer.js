import React, { Component } from 'react';
// import Dimensions from 'react-dimensions';
// import Button from 'react-toolbox/lib/button/Button';
import ReactPDF from 'react-pdf';

class PdfLayer extends Component {

	constructor(props) {
		super(props);
		this.state = this.calculateNewPdfSize(this.props.canvasSize, 
							this.pdfWidth, this.pdfHeight);
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
			this.setState(this.calculateNewPdfSize(nextProps.canvasSize,
							 this.pdfWidth, this.pdfHeight));
			// this.setState(this.calculateNewPdfSize(nextProps.containerWidth, nextProps.containerHeight, 
			// 				this.pdfWidth, this.pdfHeight));
		}
	}

	calculateNewPdfSize(canvasSize, pdfWidth, pdfHeight)
	{
		if(pdfWidth ===0 || pdfHeight === 0) {
			return {}
		}

		var pw;
		if(pdfWidth*9 > pdfHeight*16) {
			pw = canvasSize.newWidth;
		} else {
			pw = canvasSize.newHeight * (pdfWidth / pdfHeight);
		}

		return {
			pdfNewWidth: pw,
			styles: {
				position: "absolute",
				top: canvasSize.startY + "px",
				left: canvasSize.startX + "px",
				width: canvasSize.newWidth + "px",
				height: canvasSize.newHeight + "px"
			}
		}
	}

	onDocumentLoad = ({ total }) => {
		// this.setState({ total });
		this.props.setPageNumIndex(total, 0);
	}

	// onPageLoad = ({ pageIndex, pageNumber }) => {
	// 	this.setState({ pageIndex, pageNumber });
	// }
	
	pdfWidth = 0;
	pdfHeight = 0;

	onPageLoad = ({ pageIndex, pageNumber, width, height, originalWidth, originalHeight, scale }) => {
		//alert('Now displaying a page number ' + pageNumber + '!')
		//scale = this.state.newWidth / originalWidth;
		this.pdfWidth = originalWidth;
		this.pdfHeight = originalHeight;

		this.setState(this.calculateNewPdfSize(this.props.canvasSize,
							this.pdfWidth, this.pdfHeight));

		// this.props.setPageNumIndex(pageNumber, pageIndex);
	}

	render() {
		let pdf = null;
		if(this.props.pdfFile && 0 != this.props.pdfFile.length) {
			pdf = 	<div className="PdfCanvas">
						<ReactPDF
							file={this.props.pdfFile}
							onDocumentLoad={this.onDocumentLoad}
							onPageLoad={this.onPageLoad}
							width={this.state.pdfNewWidth}
							scale={this.state.pdfScale}
							pageIndex={this.props.page}
						/>
					</div>
		}

		return (
			<div style={this.state.styles} className="PdfLayer"  >
				{pdf}
			</div>
		)
	}
}

export default PdfLayer;
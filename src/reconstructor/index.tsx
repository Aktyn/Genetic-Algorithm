import React from 'react';
import GA from './../GA/ga';

const example_img = require('./../img/test.png');
// const example_img = require('./../img/psyduck.jpg');

const INPUT_W = 200;//96*4;//200
const INPUT_H = 200;//54*4;//200

const POPULATION = 50;

// let CH = 3;//number of channels
const ELEMENTS = 200;
const VALUES_PER_ELEMENT = 10;

interface ReconstructorState {
	training: boolean;
}

export default class Reconstructor extends React.Component<any, ReconstructorState> {
	private source_img: HTMLImageElement | null = null;
	private source_formatted: HTMLCanvasElement | null = null;
	private preview_container: HTMLDivElement | null = null;

	private ga = new GA(POPULATION, {
			mutation_chance: 0.01,
			mutation_scale: 0.1,
			dna_twist_chance: 0.5,
			elitism: 1
		}, {
			//deprecated - posiition (x, y), size(w, h) and rotation of each line

			//x1, y1, x2, y2, x3, y3, r, g, b a
			length: ELEMENTS * VALUES_PER_ELEMENT//INPUT_W*INPUT_H*CH
		});

	private source_data: Float32Array | null = null;//greyscaled values
	private preview_ctxs: CanvasRenderingContext2D[] = [];

	private training_id = 0;

	state: ReconstructorState = {
		training: false
	}

	constructor(props: any) {
		super(props);
	}

	componentWillUnmount() {
		this.training_id++;
	}

	onLoad() {
		if(!this.source_img || !this.source_formatted || !this.preview_container)
			throw new Error('Component is not loaded properly');

		this.source_formatted.width = INPUT_W;
		this.source_formatted.height = INPUT_H;

		let ctx = this.source_formatted.getContext('2d', {
			antialias: true
		}) as CanvasRenderingContext2D;

		ctx.drawImage(this.source_img, 0, 0, INPUT_W, INPUT_H);

		//temp for testing
		//ctx.fillStyle = '#333';
		//ctx.fillRect(0, 0, INPUT_W, INPUT_H);
		
		this.preview_container.innerText = '';
		this.preview_ctxs = [];
		for(let i=0; i<POPULATION; i++) {
			let preview = document.createElement('canvas');
			preview.width = INPUT_W;
			preview.height = INPUT_H;
			//preview.style.background = '#aaa';

			this.preview_container.appendChild(preview);
			let preview_ctx = preview.getContext('2d', {antialias: true}) as CanvasRenderingContext2D;
			preview_ctx.fillStyle = '#000';
			preview_ctx.fillRect(0, 0, INPUT_W, INPUT_H);
			this.preview_ctxs.push( preview_ctx );
		}

		let data = ctx.getImageData(0, 0, INPUT_W, INPUT_H);
		let data32 = new Float32Array(data.data.length / 4 * 3);
		//convert to float32 RGB
		for(let i=0; i<data.data.length/4; i++) {
			//0.21 R + 0.72 G + 0.07 B.
			//data32[i] = 0.21*data.data[i*4+0]/255 + 
			//	0.72*data.data[i*4+1]/255 + 
			//	0.07*data.data[i*4+2]/255;
			//(max(R, G, B) + min(R, G, B)) / 2.
			//let rgb = [data.data[i*4+0], data.data[i*4+1], data.data[i*4+2]];
			//data32[i] = (Math.max(...rgb) + Math.min(...rgb)) / 2 / 255;

			//data32[i] = Math.pow(data32[i]+0.35, 8)-0.35;

			for(let c=0; c<3; c++)
			//	data.data[i*4+c] = data32[i]*255;
				data32[i*3+c] = data.data[i*4+c]/255;
		}
		ctx.putImageData(data, 0, 0);

		this.source_data = data32;

		this.switchTraining();
	}

	//RGB order
	startTraining() {
		let bytes = 0;

		for(let i of this.ga.getIndividuals())
			bytes += i.getMemoryUsed();

		console.log('memory used by individuals:', (bytes/1024/1024).toFixed(2) + 'MB');

		let id = ++this.training_id;

		let tick = () => {
			if(id !== this.training_id)
				return;
			this.epoch();
			requestAnimationFrame(tick);
		};
		tick();
	}

	switchTraining() {
		if(this.state.training)
			this.training_id++;
		else
			this.startTraining();

		this.setState({training: !this.state.training});
	}

	epoch() {
		if(!this.source_data || this.preview_ctxs.length < POPULATION) 
			throw new Error('Cannot star evolution cause incorrect data initialization');

		let individuals = this.ga.getIndividuals();

		for(let i=0; i<individuals.length; i++) {
			let score = 0;

			//get predicted result
			let result = individuals[i].getData();
			//old - x, y, w, h, rot...
			//x1, y1, x2, y2, x3, y3, r, g, b
			this.preview_ctxs[i].fillStyle = '#fff';
			this.preview_ctxs[i].fillRect(0, 0, INPUT_W, INPUT_H);
			//this.preview_ctxs[i].lineWidth = INPUT_H*0.02;
			for(let j=0; j<result.length; j+=VALUES_PER_ELEMENT) {
				//let color = ((j+1) / result.length * 255)|0;
				//this.preview_ctxs[i].strokeStyle = `rgb(${color}, ${color}, ${color})`;
				this.preview_ctxs[i].fillStyle = 
					`rgba(${result[j+6]*255},${result[j+7]*255},${result[j+8]*255}, ${result[j+9]})`;
				//this.preview_ctxs[i].fillStyle = '#000';

				this.preview_ctxs[i].beginPath();
				this.preview_ctxs[i].moveTo(result[j+0]*INPUT_W, result[j+1]*INPUT_H);
				this.preview_ctxs[i].lineTo(result[j+2]*INPUT_W, result[j+3]*INPUT_H);
				this.preview_ctxs[i].lineTo(result[j+4]*INPUT_W, result[j+5]*INPUT_H);
				this.preview_ctxs[i].closePath();
				this.preview_ctxs[i].fill();

				/*this.preview_ctxs[i].beginPath();
				this.preview_ctxs[i].moveTo(result[j+0]*INPUT_W, result[j+1]*INPUT_H);
				this.preview_ctxs[i].lineTo(result[j+2]*INPUT_W, result[j+3]*INPUT_H);
				this.preview_ctxs[i].stroke();*/

				/*this.preview_ctxs[i].beginPath();
				this.preview_ctxs[i].arc(result[j+0]*INPUT_W, result[j+1]*INPUT_H, 
					Math.abs(result[j+2])*INPUT_H*0.1, 0, Math.PI*2, false);
				this.preview_ctxs[i].fill();*/


			}

			//calculate score
			let preview_data = this.preview_ctxs[i].getImageData(0, 0, INPUT_W, INPUT_H);
			for(let j=0; j<this.source_data.length/3; j++) {
				for(let c=0; c<3; c++)
					score += 1.0 - Math.abs(this.source_data[j*3+c] - preview_data.data[j*4+c]/255);
			}


			//this.preview_ctxs[i].putImageData(preview_data, 0, 0);

			individuals[i].setScore( score );
		}

		this.ga.evolve();
		console.log('generation:', this.ga.generation, 'best score:', this.ga.best_score);
	}

	render() {
		return <div>
			<div style={{height: '300px'}}>
				<img ref={el=>this.source_img=el} src={example_img} 
					style={{maxHeight: '100%', maxWidth: '100%'}} onLoad={() => {
						this.onLoad();
					}} />
			</div>
			<div style={{padding: '10px 0px'}}><button onClick={this.switchTraining.bind(this)}>
				{this.state.training ? 'STOP TRAINING' : 'START TRAINING'}
			</button></div>
			<div style={{display: 'grid', gridTemplateColumns: 'fit-content(100%) auto'}}>
				<canvas ref={el=>this.source_formatted=el}></canvas>
				<div ref={el=>this.preview_container=el}
					style={{display: 'flex', flexDirection: 'row', overflowX: 'auto'}}>
					TODO - AI results
				</div>
			</div>
		</div>;
	}
}
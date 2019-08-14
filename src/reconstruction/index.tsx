import * as React from 'react';
import {BufferEvolution, getWasmModule, HEAPs, onModuleLoad} from "../ga_module";

const example_images = [
	require('./../img/test.png'),
	require('./../img/test2.png'),
	require('./../img/psyduck.jpg'),
];

const INPUT_W = 100;//200
const INPUT_H = 100;//200

const POPULATION = 256;
const TOURNAMENT_SIZE = 10;
const SELECTION_PROBABILITY = 0.75;
const MAX_SPECIES = 8;
const SPECIES_SPLIT_PROBABILITY = 0.2;
const SPECIES_MERGE_PROBABILITY = 0.15;

const ELEMENTS = 1000;
const VALUES_PER_ELEMENT = 4;//x, y, alpha, size

const BUFFER_SIZE = ELEMENTS * VALUES_PER_ELEMENT;

interface ReconstructionState {
	training: boolean;
	selected_src_index: number;
}

export default class Reconstruction extends React.Component<any, ReconstructionState> {
	private source_images: (HTMLImageElement | null)[] = new Array(example_images.length).fill(null);
	private source_formatted: HTMLCanvasElement | null = null;
	private preview_container: HTMLDivElement | null = null;
	
	private evolution: BufferEvolution | null = null;

	private source_data: Float32Array | null = null;//greyscale values
	private preview_ctxs: CanvasRenderingContext2D[] = [];

	private training_id = 0;

	state: ReconstructionState = {
		training: false,
		selected_src_index: 0
	};

	constructor(props: any) {
		super(props);
	}

	componentWillUnmount() {
		this.training_id++;
		if(this.evolution)
			this.evolution.delete();
	}
	
	private selectImage(index: number) {
		this.state.selected_src_index = index;
		this.onLoad().catch(console.error);
		this.setState({selected_src_index: index});
	}

	async onLoad() {
		let source_img = this.source_images[this.state.selected_src_index];
		if(!source_img || !this.source_formatted || !this.preview_container)
			throw new Error("Components are not loaded yet");
		
		this.preview_container.innerText = '';
		this.preview_ctxs = [];
		for(let i=0; i<POPULATION; i++) {
			let preview = document.createElement('canvas');
			preview.width = INPUT_W;
			preview.height = INPUT_H;
			//preview.style.background = '#aaa';

			//if(i === 0)
				this.preview_container.appendChild(preview);
			let preview_ctx = preview.getContext(
				'2d', {antialias: true}) as CanvasRenderingContext2D;
			preview_ctx.fillStyle = '#000';
			preview_ctx.fillRect(0, 0, INPUT_W, INPUT_H);
			this.preview_ctxs.push( preview_ctx );
		}
		
		this.source_formatted.width = INPUT_W;
		this.source_formatted.height = INPUT_H;
		let ctx = this.source_formatted.getContext('2d', {
			antialias: true
		}) as CanvasRenderingContext2D;

		ctx.drawImage(source_img, 0, 0, INPUT_W, INPUT_H);

		let data = ctx.getImageData(0, 0, INPUT_W, INPUT_H);
		this.source_data = new Float32Array(data.data.length / 4/* * 3*/);
		//convert to float32 RGB
		for(let i=0; i<data.data.length/4; i++) {
			//for(let c=0; c<3; c++)
			//	data32[i*3+c] = data.data[i*4+c]/255;
			
			//grayscale
			let cLinear = 0.2126 * (data.data[i*4]/255) +
				0.7152 * (data.data[i*4+1]/255) +
				0.0722 * (data.data[i*4+2]/255);
			
			if(cLinear <= 0.0031308)
				this.source_data[i] = 12.92 * cLinear;
			else
				this.source_data[i] = 1.055 * cLinear - 0.055;
			data.data[i*4] = data.data[i*4+1] = data.data[i*4+2] = (this.source_data[i]*256)|0;
			//this.source_data[i] = data.data[i*4] / 255;//red channel
		}
		ctx.putImageData(data, 0, 0);
		
		if( this.evolution )//already initialized
			return;
		
		await onModuleLoad();
		const Module = getWasmModule();
		
		this.evolution = new Module.BufferEvolution(
			1 / ELEMENTS,//0.001,
			0.9,
			(ELEMENTS/10)|0,
			0.1,
			0.5,
			1
		);
		this.evolution.initPopulation(POPULATION, BUFFER_SIZE);
		
		this.switchTraining();
	}

	//RGB order
	startTraining() {
		if(!this.evolution)
			throw new Error("evolution is not initialized");
		let k_bytes = 0;
		
		for(let i=0; i<POPULATION; i++)
			k_bytes += this.evolution.getIndividual(i).getMemoryUsed();

		console.log(`memory used by individuals: ${(k_bytes/1024).toFixed(2)}MB`);

		let id = ++this.training_id;

		let tick = () => {
			if(id !== this.training_id)
				return;
			this.epoch();
			//requestAnimationFrame(tick);
			setImmediate(tick);
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
		if(!this.evolution)
			throw new Error("evolution is not initialized");

		//let individuals = this.evolution.getIndividuals();
		
		const square_size = (INPUT_W + INPUT_H) / Math.sqrt(ELEMENTS) / 2;

		const step = Math.max(1, square_size|0);
		const offset = ((Math.random() * this.source_data.length)|0) % step;
		//for(let i=0; i<individuals.length; i++) {
		// console.time('simulating');
		for(let i=0; i<POPULATION; i++) {
			let score = 0;
			let individual = this.evolution.getIndividual(i);

			//get predicted result
			let result_heap_index = individual.getBufferAddress() >> 2;
				//(individual.getBufferAddress() / 4) | 0;
			let result = HEAPs.HEAPF32;//.subarray(result_ptr/4, result_ptr/4 + BUFFER_SIZE);
			
			this.preview_ctxs[i].fillStyle = '#fff';
			this.preview_ctxs[i].fillRect(0, 0, INPUT_W, INPUT_H);
			// this.preview_ctxs[i].fillStyle = '#000';
			
			for(let j=result_heap_index; j<result_heap_index+BUFFER_SIZE; j+=VALUES_PER_ELEMENT) {
				this.preview_ctxs[i].fillStyle = `rgba(0, 0, 0, ${result[j+2]})`;
				let s = result[j+3] * square_size * 2;
				this.preview_ctxs[i].fillRect(
					result[j] * INPUT_W - s/2.0,
					result[j+1] * INPUT_H - s/2.0,
					s, s
				);
				/*if(result[j+2] > 0.5) {
					this.preview_ctxs[i].fillRect(
						result[j] * INPUT_W - square_size/2.0,
						result[j+1] * INPUT_H - square_size/2.0,
						square_size, square_size);
				}*/
			}

			//calculate score
			let preview_data = this.preview_ctxs[i].getImageData(0, 0, INPUT_W, INPUT_H);
			
			for(let j=offset; j<this.source_data.length; j+=step) {
				//new scoring algorithm: Delta-E
				/*let sum = 0;
				for(let c=0; c<3; c++) {
					sum += Math.pow(this.source_data[j*3+c] - preview_data.data[j*4+c]/255, 2);
					//sum += Math.abs(this.source_data[j*3+c] - preview_data.data[j*4+c]/255);
				}
				score += 1.0 - Math.sqrt(sum);*/
				//score += Math.round(preview_data.data[j*4]/255) === Math.round(this.source_data[j]) ? 1 : 0;
				score += 1.0 - Math.abs(preview_data.data[j*4]/255 - this.source_data[j]);
			}
			
			//this.preview_ctxs[i].putImageData(preview_data, 0, 0);

			individual.setScore( score );
		}
		// console.timeEnd('simulating');

		let max_score = (this.source_data.length/step)|0;///3;

		//console.time('evolving');
		this.evolution.evolve(TOURNAMENT_SIZE, SELECTION_PROBABILITY, MAX_SPECIES,
			SPECIES_SPLIT_PROBABILITY, SPECIES_MERGE_PROBABILITY);
		//console.timeEnd('evolving');
		console.log(`generation: ${this.evolution.getGeneration()}, best score: ${this.evolution.getBestScore()|0}, ${
			((this.evolution.getBestScore() / max_score*100)|0)}%, species: ${this.evolution.getNumberOfSpecies()}`);
	}

	render() {
		return <div>
			<div style={{height: '300px'}}>{
				example_images.map((img_src, index) => {
					return <img key={index} ref={el => this.source_images[index] = el} src={img_src}
						style={{
							maxHeight: '100%', maxWidth: '100%',
							border: this.state.selected_src_index === index ? '1px solid #f55' : 'none'
						}} onLoad={() => {
							if(index === this.state.selected_src_index)
								this.onLoad().catch(console.error);
						}} onClick={() => this.selectImage(index)} alt={'source img'} />;
				})
			}</div>
			<div style={{padding: '10px 0px'}}><button onClick={this.switchTraining.bind(this)}>
				{this.state.training ? 'STOP TRAINING' : 'START TRAINING'}
			</button></div>
			<div style={{display: 'grid', gridTemplateColumns: 'fit-content(100%) auto'}}>
				<canvas ref={el => this.source_formatted = el}/>
				<div ref={el=>this.preview_container=el}
					style={{display: 'flex', flexDirection: 'row', overflowX: 'auto'}}>
					TODO - AI results
				</div>
			</div>
		</div>;
	}
}
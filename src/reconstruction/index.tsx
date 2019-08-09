import * as React from 'react';
// import GA from './../GA/ga';
const Module = require('../../wasm_out/ga.js')();
console.log(Module);

// const example_img = require('./../img/test.png');
const example_img = require('./../img/psyduck.jpg');

let module_loaded = false;
let onModuleLoaded: (() => void) | null = null;
async function onPostRun() {
	if(module_loaded)
		return Promise.resolve();
	return new Promise((resolve) => onModuleLoaded = resolve);
}

Module.addOnPostRun(() => {
	module_loaded = true;
	if( onModuleLoaded )
		onModuleLoaded();
});

interface BufferIndividualSchema {
	getMemoryUsed(): number;
	//getBuffer(): number[];
	getBufferAddress(): number;
	setScore(score: number): void;
}

interface EvolutionSchema {
	initPopulation(population: number, buffer_size: number): void;
	getIndividual(index: number): BufferIndividualSchema;
	getGeneration(): number;
	getBestScore(): number;
	evolve(): void;
	
	delete(): void;
}

const INPUT_W = 200;//96*4;//200
const INPUT_H = 200;//54*4;//200

const POPULATION = 10;

// let CH = 3;//number of channels
const ELEMENTS = 800;
const VALUES_PER_ELEMENT = 7;

const BUFFER_SIZE = ELEMENTS * VALUES_PER_ELEMENT;

interface ReconstructionState {
	training: boolean;
}

export default class Reconstruction extends React.Component<any, ReconstructionState> {
	private source_img: HTMLImageElement | null = null;
	private source_formatted: HTMLCanvasElement | null = null;
	private preview_container: HTMLDivElement | null = null;

	/*private ga = new GA(POPULATION, {
			mutation_chance: 0.005,
			mutation_scale: 0.1,
			dna_twist_chance: 0.5,
			dna_splits: ELEMENTS,//20
			elitism: 0
		}, {
			//deprecated - position (x, y), size(w, h) and rotation of each line

			//x1, y1, x2, y2, x3, y3, r, g, b a
			length: ELEMENTS * VALUES_PER_ELEMENT//INPUT_W*INPUT_H*CH
		});*/
	private evolution: EvolutionSchema | null = null;

	private source_data: Float32Array | null = null;//greyscale values
	private preview_ctxs: CanvasRenderingContext2D[] = [];

	private training_id = 0;

	state: ReconstructionState = {
		training: false
	};

	constructor(props: any) {
		super(props);
	}

	componentWillUnmount() {
		this.training_id++;
		if(this.evolution)
			this.evolution.delete();
	}

	async onLoad() {
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

			//if(i === 0)
				this.preview_container.appendChild(preview);
			let preview_ctx = preview.getContext(
				'2d', {antialias: true}) as CanvasRenderingContext2D;
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

		await onPostRun();
		
		const params = {
			mutation_chance: 0.005,
			mutation_scale: 0.2,
			dna_twist_chance: 0.1,
			dna_splits: (ELEMENTS/8)|0,//20
			elitism: 1
		};
		this.evolution = new Module.BufferEvolution(params.mutation_chance, params.mutation_scale, params.dna_splits,
			params.dna_twist_chance, params.elitism) as EvolutionSchema;
		this.evolution.initPopulation(POPULATION, BUFFER_SIZE);
		
		//let ptr = this.evolution.getIndividual(0).getBufferAddress();
		// console.log( Module.HEAPF32[ptr/4+2] );
		//console.log( Module.HEAPF32.subarray(ptr/4, ptr/4+5) );
		this.switchTraining();
	}

	//RGB order
	startTraining() {
		if(!this.evolution)
			throw new Error("evolution is not initialized");
		let k_bytes = 0;

		//let individuals = this.evolution.getIndividuals();
		//for(let i of individuals)
		//	bytes += i.getMemoryUsed();
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
		
		const block_size = (INPUT_W + INPUT_H) / Math.sqrt(ELEMENTS);

		//for(let i=0; i<individuals.length; i++) {
		for(let i=0; i<POPULATION; i++) {
			let score = 0;
			let individual = this.evolution.getIndividual(i);

			//get predicted result
			let result_heap_index = (individual.getBufferAddress() / 4) | 0;
			let result = Module.HEAPF32;//.subarray(result_ptr/4, result_ptr/4 + BUFFER_SIZE);
			//old - x, y, w, h, rot...
			//x1, y1, x2, y2, x3, y3, r, g, b
			this.preview_ctxs[i].fillStyle = '#fff';
			this.preview_ctxs[i].fillRect(0, 0, INPUT_W, INPUT_H);
			
			//this.preview_ctxs[i].lineWidth = INPUT_H*0.02;
			for(let j=result_heap_index; j<result_heap_index+BUFFER_SIZE; j+=VALUES_PER_ELEMENT) {
				//let color = ((j+1) / result.length * 255)|0;
				//this.preview_ctxs[i].strokeStyle = `rgb(${color}, ${color}, ${color})`;
				this.preview_ctxs[i].fillStyle = 
					`rgba(${result[j+3]*255}, ${result[j+4]*255}, ${result[j+5]*255}, ${result[j+6]})`;
				//this.preview_ctxs[i].fillStyle = '#000';

				/*this.preview_ctxs[i].beginPath();
				this.preview_ctxs[i].moveTo(result[j]*INPUT_W, result[j+1]*INPUT_H);
				this.preview_ctxs[i].lineTo(result[j+2]*INPUT_W, result[j+3]*INPUT_H);
				this.preview_ctxs[i].lineTo(result[j+4]*INPUT_W, result[j+5]*INPUT_H);
				this.preview_ctxs[i].closePath();
				this.preview_ctxs[i].fill();*/
				this.preview_ctxs[i].fillRect(
					result[j]*INPUT_W, result[j+1]*INPUT_H,
					result[j+2]*block_size, result[j+2]*block_size
				);
				

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
				//for(let c=0; c<3; c++)
				//	score += 1.0 - Math.abs(this.source_data[j*3+c] - preview_data.data[j*4+c]/255);
				
				//new scoring algorithm: Delta-E
				let sum = 0;
				for(let c=0; c<3; c++) {
					sum += Math.pow(this.source_data[j*3+c] - preview_data.data[j*4+c]/255, 2);
				}
				score += 1.0 - Math.sqrt(sum);
			}


			//this.preview_ctxs[i].putImageData(preview_data, 0, 0);

			individual.setScore( score );
		}

		let max_score = this.source_data.length/3;

		//console.time('evolving');
		this.evolution.evolve();
		//console.timeEnd('evolving');
		console.log(`generation: ${this.evolution.getGeneration()}, best score: ${this.evolution.getBestScore()|0}, ${
			((this.evolution.getBestScore() / max_score*100)|0)}%`);
	}

	render() {
		return <div>
			<div style={{height: '300px'}}>
				<img ref={el=>this.source_img=el} src={example_img} alt={'source img'}
					style={{maxHeight: '100%', maxWidth: '100%'}} onLoad={() => {
						this.onLoad().catch(console.error);
					}} />
			</div>
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
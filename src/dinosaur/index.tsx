import React from 'react';

import DinoGame, {Player} from './game';
// import GA, {ActivationFunctions} from './../GA/ga';
// import Individual from './../GA/individual';
import {getWasmModule, HEAPs, NetworkEvolution, NetworkIndividual, onModuleLoad} from "../ga_module";

const WIDTH = 800;
const HEIGHT = 400;

const POPULATION = 256;
const TOURNAMENT_SIZE = 5;
const SELECTION_PROBABILITY = 0.8;
const MAX_SPECIES = 6;
const SPECIES_SPLIT_PROBABILITY = 0.1;
const SPECIES_MERGE_PROBABILITY = 0.09;

interface DinoState {
	generation: number;
}

export default class extends React.Component<any, DinoState> {
	private game: DinoGame | null = null;
	private user_player: Player | null = null;
	private ai_player: Player | null = null;

	private best_individual: NetworkIndividual | null = null;

	private iterations = 1;

	//private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;

	private tick_bind = this.tick.bind(this);

	// private ga: GA | null = null;
	private evolution: NetworkEvolution | null = null;
	private in_buffer = 0;//nullptr
	
	state: DinoState = {
		generation: 0
	};

	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		window.addEventListener('keydown', this.onKeyDown.bind(this), false);
		window.addEventListener('keyup', this.onKeyUp.bind(this), false);

		this.startEvolution().catch(console.error);//temp

		//run loop
		this.tick_bind();
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.onKeyDown.bind(this), false);
		window.removeEventListener('keyup', this.onKeyUp.bind(this), false);
		this.game = null;
		//this.ga = null;
		if(this.evolution)
			this.evolution.delete();
		if(this.in_buffer)
			HEAPs.free(this.in_buffer);
	}

	onKeyDown(e: KeyboardEvent) {
		if(!this.user_player)
			return;

		switch(e.keyCode) {
			case 38:
			case 32:
				this.user_player.jump();
				break;
			case 40:
				this.user_player.duck(true);
				break;
		}
	}

	onKeyUp(e: KeyboardEvent) {
		if(!this.user_player)
			return;

		switch(e.keyCode) {
			case 40:
				this.user_player.duck(false);
				break;
		}
	}

	startUserGame() {
		this.iterations = 1;
		this.game = new DinoGame();
		this.user_player = this.game.start(1)[0];
		this.ai_player = null;
	}

	startAIGame() {
		this.iterations = 1;
		this.game = new DinoGame();
		this.user_player = null;
		this.ai_player = this.game.start(1)[0];
	}

	async startEvolution() {
		await onModuleLoad();
		const Module = getWasmModule();
		
		this.game = new DinoGame();
		this.game.start(POPULATION);
		this.user_player = null;
		this.ai_player = null;
		if(this.evolution === null) {
			this.in_buffer = HEAPs.malloc(4 * Float32Array.BYTES_PER_ELEMENT);//4 inputs to neural network
			
			this.evolution = new Module.NetworkEvolution(
				0.001,
				0.8,
				5,
				0.5,
				2.0,
				1
			);
			let hidden_layers = Module.createVector();
			hidden_layers.push_back(8);
			hidden_layers.push_back(16);
			hidden_layers.push_back(32);
			hidden_layers.push_back(16);
			hidden_layers.push_back(8);
			this.evolution.initPopulation(POPULATION, 4, hidden_layers, 2, Module.ACTIVATION.TANH);
			hidden_layers.delete();
		}
	}

	tick() {
		if(!this.game || this.game.isOver()) {
			requestAnimationFrame(this.tick_bind);
			return;
		}

		for(let i=0; i<this.iterations; i++) {
			let players: Player[] = this.game.getPlayers();
			//let individuals: Individual[] | null = null;

			if(this.evolution && this.user_player === null) {//bots training
				//individuals = this.ga.getIndividuals();
				for(let i=0; i<POPULATION && i<players.length; i++) {
					if(!players[i].alive)
						continue;
					let nearest_obstacle = this.game.getNearestObstacle(players[i]);
					let bot_input: number[] = [
						players[i].y, 
						(nearest_obstacle.x+nearest_obstacle.width)-(players[i].x-players[i].width), 
						nearest_obstacle.y,
						this.game.getSpeed()
					];
					//console.log( Float32Array.from(bot_input) );
					HEAPs.HEAPF32.set(Float32Array.from(bot_input), this.in_buffer >> 2);
					let nn_result_ptr = this.evolution.getIndividual(i).calculateOutput(this.in_buffer) >> 2;
					
					if(HEAPs.HEAPF32[nn_result_ptr+1] > 0)
						players[i].duck(true);
					else
						players[i].duck(false);
					if(HEAPs.HEAPF32[nn_result_ptr] > 0)
						players[i].jump();
				}
			}
			else if(this.evolution && this.ai_player !== null && this.best_individual) {//user's or best ai's game
				let nearest_obstacle = this.game.getNearestObstacle(players[i]);
				let bot_input = [
					players[i].y, 
					(nearest_obstacle.x+nearest_obstacle.width)-(players[i].x-players[i].width), 
					nearest_obstacle.y,
					this.game.getSpeed()
				];
				HEAPs.HEAPF32.set(Float32Array.from(bot_input), this.in_buffer >> 2);
				let nn_result_ptr = this.best_individual.calculateOutput(this.in_buffer) >> 2;
					
				if(HEAPs.HEAPF32[nn_result_ptr+1] > 0)
					this.ai_player.duck(true);
				else
					this.ai_player.duck(false);
				if(HEAPs.HEAPF32[nn_result_ptr] > 0)
					this.ai_player.jump();
			}

			this.game.update();

			if(this.game.isOver() && this.evolution && this.user_player === null &&
				this.ai_player === null) 
			{
				for(let i=0; i<POPULATION && i<players.length; i++) {
					this.evolution.getIndividual(i).setScore( players[i].score );
				}
				this.evolution.evolve(TOURNAMENT_SIZE, SELECTION_PROBABILITY, MAX_SPECIES,
					SPECIES_SPLIT_PROBABILITY, SPECIES_MERGE_PROBABILITY);
				//this.best_individual = this.evolution.getBestIndividual();
				this.best_individual = this.evolution.getIndividual(0);

				console.log(`evolving generation: ${this.evolution.getGeneration()}, best score: ${
					this.evolution.getBestScore()}, species: ${this.evolution.getNumberOfSpecies()}`);
				this.setState({generation: this.evolution.getGeneration()});

				this.game.start(POPULATION);
			}
		}

		if(this.ctx)
			this.renderGame(this.game, this.ctx);

		requestAnimationFrame(this.tick_bind);
	}

	loadCanvas(el: HTMLCanvasElement | null) {
		//this.canvas = el;
		if(!el)
			return;
		el.width = WIDTH;
		el.height = HEIGHT;

		this.ctx = el.getContext('2d', {antialiasing: true}) as CanvasRenderingContext2D;
		//this.ctx.transform(1, 0, 0, -1, 0, HEIGHT);//flips vertically
	}

	renderRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
		ctx.fillRect(x*HEIGHT, (1 - y-h)*HEIGHT, w*HEIGHT, h*HEIGHT);
	}

	renderGame(game: DinoGame, ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = '#bcf';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		ctx.fillStyle = '#678';
		for(let obstacle of game.getObstacles()) {
			this.renderRect(ctx, obstacle.x-game.getCamera(), obstacle.y, 
				obstacle.width, obstacle.height);
		}

		ctx.fillStyle = '#f554';
		for(let player of game.getPlayers()) {
			this.renderRect(ctx, player.x-game.getCamera(), player.y, player.width, player.height);
		}

		ctx.fillStyle = '#000';
		ctx.font = '15px Helvetica';
		ctx.textBaseline = 'top';
		ctx.fillText(game.getScore().toString(), 0, 0);
	}

	render() {
		return <div>
			<nav style={{margin: '10px 0px'}}>
				<button onClick={event => {
					this.startUserGame();
					//@ts-ignore
					event.nativeEvent.target.blur();
				}}>PLAY</button>
				<button onClick={event => {
					this.startEvolution().catch(console.error);
					//@ts-ignore
					event.nativeEvent.target.blur();
				}}>RUN EVOLUTION</button>
				<button onClick={event => {
					this.startAIGame();
					//@ts-ignore
					event.nativeEvent.target.blur();
				}}>PLAY AI</button>
				<br />
				<label>Iterations:</label>
				<input type='number' min={1} defaultValue='1' onChange={e => {
					this.iterations = parseInt(e.target.value);
				}} />
			</nav>
			<div>Generation: {this.state.generation}</div>
			<div>
				<canvas ref={this.loadCanvas.bind(this)}/>
			</div>
		</div>;
	}
}
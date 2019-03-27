import React from 'react';

import DinoGame, {Player} from './game';
import GA, {ActivationFunctions} from './GA/ga';
import Individual from './GA/individual';

const WIDTH = 800;
const HEIGHT = 400;

const POPULATION = 50;

interface DinoState {
	generation: number;
}

export default class extends React.Component<any, DinoState> {
	private game: DinoGame | null = null;
	private user_player: Player | null = null;
	private ai_player: Player | null = null;

	private best_individual: Individual | null = null;

	private iterations = 1;

	//private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;

	private tick_binded = this.tick.bind(this);

	private ga: GA | null = null;

	state: DinoState = {
		generation: 0
	}

	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		window.addEventListener('keydown', this.onKeyDown.bind(this), false);
		window.addEventListener('keyup', this.onKeyUp.bind(this), false);

		this.startEvolution();//temp

		//run loop
		this.tick_binded();
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.onKeyDown.bind(this), false);
		window.removeEventListener('keyup', this.onKeyUp.bind(this), false);
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

	startEvolution() {
		this.game = new DinoGame();
		this.game.start(POPULATION);
		this.user_player = null;
		this.ai_player = null;
		if(this.ga === null) {
			this.ga = new GA(POPULATION, {inputs: 4, hidden_layers: [16, 8], outputs: 2}, 
				ActivationFunctions.tanh);
		}
	}

	tick() {
		if(!this.game || this.game.isOver()) {
			requestAnimationFrame(this.tick_binded);
			return;
		}

		for(let i=0; i<this.iterations; i++) {
			let players = this.game.getPlayers();
			let individuals: Individual[] | null = null;

			if(this.ga && this.user_player === null) {
				individuals = this.ga.getIndividuals();
				for(let i=0; i<individuals.length && i<players.length; i++) {
					if(!players[i].alive)
						continue;
					let nearest_obstacle = this.game.getNearestObstacle(players[i]);
					let bot_input = [
						players[i].y, 
						(nearest_obstacle.x+nearest_obstacle.width)-(players[i].x-players[i].width), 
						nearest_obstacle.y,
						this.game.getSpeed()
					];
					// console.log( bot_input, individuals[i].action(bot_input) );
					let nn_result = individuals[i].action(bot_input);
					
					if(nn_result[1] > 0)
						players[i].duck(true);
					else
						players[i].duck(false);
					if(nn_result[0] > 0)
						players[i].jump();
				}
			}
			else if(this.ga && this.ai_player !== null && this.best_individual) {
				let nearest_obstacle = this.game.getNearestObstacle(players[i]);
				let bot_input = [
					players[i].y, 
					(nearest_obstacle.x+nearest_obstacle.width)-(players[i].x-players[i].width), 
					nearest_obstacle.y,
					this.game.getSpeed()
				];

				let nn_result = this.best_individual.action(bot_input);
					
				if(nn_result[1] > 0)
					this.ai_player.duck(true);
				else
					this.ai_player.duck(false);
				if(nn_result[0] > 0)
					this.ai_player.jump();
			}

			this.game.update();

			if(this.game.isOver() && individuals && this.ga && this.user_player === null && 
				this.ai_player === null) 
			{
				for(let i=0; i<individuals.length && i<players.length; i++) {
					individuals[i].setScore( players[i].score );// / this.game.getScore();
					//console.log(individuals[i].score);
				}
				this.ga.evolve();
				this.best_individual = this.ga.getBest().clone();

				console.log('evolving generation:', this.ga.generation, 
					'best score:', this.ga.best_score);
				this.setState({generation: this.ga.generation});

				this.game.start(POPULATION);
			}
		}

		if(this.ctx)
			this.renderGame(this.game, this.ctx);

		requestAnimationFrame(this.tick_binded);
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
					this.startEvolution();
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
				<canvas ref={this.loadCanvas.bind(this)}></canvas>
			</div>
		</div>;
	}
}
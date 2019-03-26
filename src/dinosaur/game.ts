/** contains only game logic (no render methods) */
const INITIAL_OBSTACLES = 10;
const MIN_DISTANCE_BETWEEN_OBSTACLES = 0.4;
const MAX_DISTANCE_BETWEEN_OBSTRACLES = 0.8;
const CAMERA_OFFSET = 0.3;
const JUMP_STRENGTH = 2.5;
const DUCK_STRENGTH = 15;
const GRAVITY = 7;
const STEP = 1/60;

function gauss(lvl: number) {
	let out = 1;
	for(let i=0; i<lvl; i++)
		out *= Math.random();
	return out;
}

class RectObject {
	protected pos: {x: number; y: number};
	protected size: {width: number; height: number};

	constructor(_x = 0, _y = 0, _width = 0.1, _height = 0.1) {
		this.pos = {x: _x, y: _y};
		this.size = {width: _width, height: _height};
	}

	get x() { return this.pos.x; }
	get y() { return this.pos.y; }

	get width() { return this.size.width; }
	get height() { return this.size.height; }

	collideWith(other_rect: RectObject) {
		return !(this.x+this.width < other_rect.x || this.x > other_rect.x+other_rect.width ||
			this.y+this.height < other_rect.y || this.y > other_rect.y+other_rect.height);
	}
}

export abstract class Player extends RectObject {
	public alive = true;
	public score = 0;

	abstract jump(): void;
	abstract duck(enable: boolean): void;
}

class DinoPlayer extends Player {
	private velocity_y = 0;
	private ducking = false;

	constructor() {
		super(0, 0, 0.1, 0.2);
	}

	move(speed: number) {
		this.pos.x += speed*STEP;
		this.velocity_y = Math.max(-GRAVITY, this.velocity_y - GRAVITY*STEP);
		this.pos.y = Math.max(0, this.pos.y + this.velocity_y*STEP);
		
		if(this.ducking) {
			if(this.y > 0)
				this.velocity_y = Math.max(-GRAVITY, this.velocity_y - DUCK_STRENGTH*STEP);
			else
				this.size.height = 0.1;
		}
		else if(this.y === 0)
			this.size.height = 0.2;
	}

	jump() {
		if(this.y === 0)
			this.velocity_y = JUMP_STRENGTH;
	}

	duck(enable: boolean) {
		this.ducking = enable;
	}
}

export default class DinoGame {
	private players: DinoPlayer[] = [];
	private obstacles: RectObject[] = [];
	private furthest_obstacle = 0.5;//start
	private camera = -CAMERA_OFFSET;

	private game_speed = 0.6;

	private score = 0;

	constructor() {

	}

	getPlayers() {
		return this.players as Player[];
	}

	getObstacles() {
		return this.obstacles;
	}

	getCamera() {
		return this.camera;
	}

	getScore() {
		return this.score;
	}

	getSpeed() {
		return this.game_speed;
	}

	isOver() {//returns false if at least one player is alive
		return !this.players.some(p => p.alive);
	}

	start(number_of_players: number) {
		this.game_speed = 0.6;
		this.score = 0;
		this.furthest_obstacle = 0.5;
		this.camera = -CAMERA_OFFSET;

		//generate obstacles
		this.obstacles = [];
		for(let i=0; i<INITIAL_OBSTACLES; i++)
			this.putObstacle();

		//generate players
		this.players = [];

		for(let i=0; i<number_of_players; i++) {
			this.players.push(new DinoPlayer());
		}

		return this.players as Player[];
	}

	private putObstacle() {
		this.furthest_obstacle += MIN_DISTANCE_BETWEEN_OBSTACLES + 
			Math.random() * (MAX_DISTANCE_BETWEEN_OBSTRACLES - MIN_DISTANCE_BETWEEN_OBSTACLES);
		let heights = [0, 0.15, 0.3];
		this.obstacles.push(new RectObject(this.furthest_obstacle, 
			heights[(gauss(2)*heights.length)|0], 0.1, 0.1));
	}

	public getNearestObstacle(player: Player) {
		for(let obstacle of this.obstacles) {
			if(obstacle.x+obstacle.width > player.x-player.width)
				return obstacle;
		}
		throw new Error("Cannot find nearest obstacle");
	}

	update() {
		for(let p of this.players) {
			if(!p.alive)
				continue;
			//p.score = this.score;
			p.score++;
			p.move(this.game_speed);
			this.camera = Math.max(this.camera, p.x-CAMERA_OFFSET);

			//checking collisions
			for(let obstacle of this.obstacles) {
				if(p.collideWith(obstacle))
					p.alive = false;
			}
		}

		//this.camera += this.game_speed;
		if(this.obstacles.length > 0 && this.obstacles[0].x+this.obstacles[0].width < this.camera) {
			this.obstacles.shift();
			this.putObstacle();
			// this.score++;
		}
		this.score++;

		this.game_speed *= 1.0001;
	}
}
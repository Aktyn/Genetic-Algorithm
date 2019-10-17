import React from 'react';
import TspEnvironment, { Point } from './tsp_environment';
import {TspEvolution, getWasmModule, HEAPs, onModuleLoad} from "../ga_module";

const CANVAS_RES = 512;
const POINT_SIZE = 3;//radius in pixels
const POINTS_COUNT = 64;

const POPULATION = 1000;
const TOURNAMENT_SIZE = 32;
const SELECTION_PROBABILITY = 0.8;
const MAX_SPECIES = 8;
const SPECIES_SPLIT_PROBABILITY = 0.02;
const SPECIES_MERGE_PROBABILITY = 0.015;

const ITERATIONS_PER_STEP = 10;

const pow2 = (n: number) => n*n;

interface TspViewState {
    environment: TspEnvironment | null;
    ready: boolean;
    running: boolean;
}

export default class TspView extends React.Component<any, TspViewState> {
    private ctx: CanvasRenderingContext2D | null = null;
    private readonly step = this.tspStep.bind(this);
    private frame_index = 0;

    private evolution: TspEvolution | null = null;
    private bestSolution: number[] = new Array(POINTS_COUNT).fill(0).map((_p, i) => i);

    state: TspViewState = {
        environment: new TspEnvironment(POINTS_COUNT),
        ready: false,
        running: false
    };

    async componentDidMount() {
        this.redrawCanvas();

        await onModuleLoad();
        const Module = getWasmModule();
        this.evolution = new Module.TspEvolution(
			1 / POINTS_COUNT,//0.02,
			0.5,//does nothing in TSP
			4,
			0.5,
			4.0,
			2
		);
		this.evolution.initPopulation(POPULATION, POINTS_COUNT);

        this.setState({ready: true});
    }

    componentWillUnmount() {
		if(this.evolution)
			this.evolution.delete();
	}

    componentDidUpdate(_prevProps: any, prevState: TspViewState) {
        if(this.state.running !== prevState.running) {
            if(this.state.running)
                this.runTraining();
        }
    }

    private runTraining() {
        if(!this.evolution)
            return;

        let k_bytes = 0;
		for(let i=0; i<POPULATION; i++)
			k_bytes += this.evolution.getIndividual(i).getMemoryUsed();

        console.log(`memory used by individuals: ${(k_bytes/1024).toFixed(2)}MB`);
        
        window.cancelAnimationFrame(this.frame_index);
        this.step();
    }

    private calculateTravelDistance(env: TspEnvironment, heap: Uint32Array, heap_start: number) {
        let dst = 0;

        const start = env.startingPoint;
        const firstP = env.points[ heap[heap_start] ];
        const lastP = env.points[ heap[heap_start+POINTS_COUNT-1] ];

        //add distance from starting point to first destination and from last destination back to starting point
        dst += Math.sqrt( pow2(start.x - firstP.x) + pow2(start.y-firstP.y) ) + 
            Math.sqrt( pow2(start.x - lastP.x) + pow2(start.y-lastP.y) );

        //sum distances between successive destinations
        for(let i=0; i<POINTS_COUNT-1; i++) {
            let p1 = env.points[    heap[heap_start+i]     ];
            let p2 = env.points[    heap[heap_start+i+1]   ];
            dst += Math.sqrt( pow2(p1.x-p2.x) + pow2(p1.y-p2.y) );
        }

        return dst;
    }

    private tspStep() {
        if(!this.evolution)
			throw new Error("evolution is not initialized");
        if(!this.state.environment)
            return;

        for(let iteration=0; iteration<ITERATIONS_PER_STEP; iteration++) {
            let best_score = 0, best_index = 0;

            for(let i=0; i<POPULATION; i++) {
                let individual = this.evolution.getIndividual(i);

                let result_heap_index = individual.getBufferAddress() >> 2;

                let travel_distance = this.calculateTravelDistance(this.state.environment,HEAPs.HEAPU32, result_heap_index);
                let score = POINTS_COUNT / travel_distance;
                //console.log('individual:', i, 'travel distance:', travel_distance, 'score: ', score);

                individual.setScore( score );

                if(score > best_score) {
                    best_score = score;
                    best_index = i;
                }
            }

            let best_individual = this.evolution.getIndividual(best_index);
            for(let i=0; i<POINTS_COUNT; i++) {
                let best_result_heap_index = best_individual.getBufferAddress() >> 2;
                //console.log('test', HEAPs.HEAPU32[best_result_heap_index+i]);
                this.bestSolution[i] = HEAPs.HEAPU32[best_result_heap_index+i];
            }

            this.evolution.evolve(TOURNAMENT_SIZE, SELECTION_PROBABILITY, MAX_SPECIES,
                SPECIES_SPLIT_PROBABILITY, SPECIES_MERGE_PROBABILITY);
            console.log(`generation: ${this.evolution.getGeneration()}, best score: ${this.evolution.getBestScore().toFixed(2)}, species: ${this.evolution.getNumberOfSpecies()}`);
        }

        this.redrawCanvas();

        if(this.state.running)
            this.frame_index = window.requestAnimationFrame(this.step);
    }

    private drawPoint(ctx: CanvasRenderingContext2D, point: Point, size: number) {
        ctx.beginPath();
        ctx.arc(CANVAS_RES * point.x, CANVAS_RES * point.y, size, 0, Math.PI*2);
        ctx.fill();
    }

    private drawRoute(ctx: CanvasRenderingContext2D, env: TspEnvironment, route: number[]) {
        ctx.beginPath();
        ctx.moveTo(env.startingPoint.x*CANVAS_RES, env.startingPoint.y*CANVAS_RES);
        for(let point_i of route) {
            let point = env.points[point_i];
            ctx.lineTo(point.x*CANVAS_RES, point.y*CANVAS_RES);
        }
        ctx.lineTo(env.startingPoint.x*CANVAS_RES, env.startingPoint.y*CANVAS_RES);
        ctx.stroke();
    }

    private redrawCanvas() {
        if( !this.ctx || !this.state.environment )
            return;
        const points = this.state.environment.points;
        const starting_point = this.state.environment.startingPoint;

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, CANVAS_RES, CANVAS_RES);

        //draw solution path
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#B39DDB';
        this.drawRoute(this.ctx, this.state.environment, this.bestSolution);

        //draw starting points
        this.ctx.fillStyle = '#BA68C8';
        this.drawPoint(this.ctx, starting_point, POINT_SIZE*1.618);

        //draw interim points
        this.ctx.fillStyle = '#7986CB';
        for(let point of points)
            this.drawPoint(this.ctx, point, POINT_SIZE);
    }

    render() {
        return <div>
            <canvas width={CANVAS_RES} height={CANVAS_RES} ref={el => {
                if(el)
                    this.ctx = el.getContext('2d', {antialias: true, alpha: false}) as CanvasRenderingContext2D;
                else
                    this.ctx = null;
            }} />
            {this.state.ready && <div>
                <button onClick={() => {
                    this.setState({running: !this.state.running});
                }}>{this.state.running ? 'PAUSE' : 'RUN'}</button>
            </div>}
        </div>;
    }
}
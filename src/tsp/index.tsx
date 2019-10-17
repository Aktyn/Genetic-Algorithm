import React from 'react';
import TSP, { Point } from './tsp';

const CANVAS_RES = 512;
const POINT_SIZE = 5;//radius in pixels

interface TspViewState {
    tsp: TSP | null;
    running: boolean;
}

export default class TspView extends React.Component<any, TspViewState> {
    private ctx: CanvasRenderingContext2D | null = null;
    private readonly step = this.tspStep.bind(this);
    private frame_index = 0;

    state: TspViewState = {
        tsp: new TSP(),
        running: false,
    };

    componentDidMount() {
        this.redrawCanvas();
    }

    componentDidUpdate(_prevProps: any, prevState: TspViewState) {
        if(this.state.running !== prevState.running) {
            if(this.state.running) {
                window.cancelAnimationFrame(this.frame_index);
                this.tspStep();
            }
        }
    }

    private tspStep() {
        if(!this.state.tsp)
            return;
        this.state.tsp.update();
        this.redrawCanvas();

        if(this.state.running)
            this.frame_index = window.requestAnimationFrame(this.step);
    }

    private drawPoint(ctx: CanvasRenderingContext2D, point: Point, size: number) {
        ctx.beginPath();
        ctx.arc(CANVAS_RES * point.x, CANVAS_RES * point.y, size, 0, Math.PI*2);
        ctx.fill();
    }

    private redrawCanvas() {
        if( !this.ctx || !this.state.tsp )
            return;
        const points = this.state.tsp.getPoints();
        const starting_point = this.state.tsp.getStartingPoint()

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, CANVAS_RES, CANVAS_RES);

        //draw solution path
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#B39DDB';

        this.ctx.beginPath();
        this.ctx.moveTo(starting_point.x*CANVAS_RES, starting_point.y*CANVAS_RES);
        for(let point_i of this.state.tsp.getSolution()) {
            let point = points[point_i];
            this.ctx.lineTo(point.x*CANVAS_RES, point.y*CANVAS_RES);
        }
        this.ctx.stroke();

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
            <div>
                <button onClick={() => {
                    this.setState({running: !this.state.running});
                }}>{this.state.running ? 'PAUSE' : 'RUN'}</button>
            </div>
        </div>;
    }
}
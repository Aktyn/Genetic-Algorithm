
export interface Point {
    x: number;
    y: number;
}

export default class TSP {
    private startingPoint: Point;
    private points: Point[];

    private solution: number[];//ordered list of point indexes

    constructor(starting_point = <Point>{x: 0.5, y: 0.5}, points_number = 16) {
        this.startingPoint = starting_point;
        this.points = new Array(points_number).fill(0).map(p => this.generateRandomPoint());

        this.solution = new Array(points_number).fill(0).map((p, i) => i);
    }

    public getStartingPoint(): Readonly<Point> {
        return this.startingPoint;
    }

    public getPoints(): Readonly<Point[]> {
        return this.points;
    }

    public getSolution(): Readonly<number[]> {
        return this.solution;
    }

    public update() {
        
    }

    private generateRandomPoint(): Point {
        return {
            x: Math.random(),
            y: Math.random()
        };
    }
}
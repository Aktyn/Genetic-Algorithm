export interface Point {
    x: number;
    y: number;
}

function generateRandomPoint(): Point {
    return {
        x: Math.random(),
        y: Math.random()
    };
}

export default class TspEnvironment {
    public readonly startingPoint: Point;
    public readonly points: Point[];

    constructor(points_number = 16, starting_point = <Point>{x: 0.5, y: 0.5}) {
        this.startingPoint = starting_point;
        this.points = new Array(points_number).fill(0).map(p => generateRandomPoint());
    }
}
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

const pow2 = (n: number) => n*n;

function calcDistance(p1: Point, p2: Point) {
    return Math.sqrt( pow2(p1.x-p2.x) + pow2(p1.y-p2.y) );
}

export default class TspEnvironment {
    public readonly startingPoint: Point;
    public readonly points: Point[];
    //N*N symmetrical matrix where N is number of interim points
    private readonly cachedDistances: number[][];

    private readonly naiveSolution: number[] = [];
    private naiveSolutionDistance = 0;

    constructor(points_number = 16, starting_point = <Point>{x: 0.5, y: 0.5}) {
        this.startingPoint = starting_point;
        this.points = new Array(points_number).fill(0).map(p => generateRandomPoint());
        this.cachedDistances = this.calculateDistances(this.points);

        this.naiveSolution = this.calculateNaiveSolution();
    }
    
    private calculateNaiveSolution() {
        let current_point = this.startingPoint;
        let remaining_points = this.points.map((_p, i) => i);

        let naiveSolution: number[] = [];
        while(remaining_points.length > 0) {
            let closest_dst = Number.MAX_SAFE_INTEGER, closest_point_i = 0;
            for(let point_index of remaining_points) {
                let dst = calcDistance(current_point, this.points[point_index]);
                if(dst < closest_dst) {
                    closest_dst = dst;
                    closest_point_i = point_index;
                }
            }

            this.naiveSolutionDistance += closest_dst;

            remaining_points.splice(remaining_points.indexOf(closest_point_i), 1);
            naiveSolution.push( closest_point_i );
            current_point = this.points[closest_point_i];
        }

        //add distance from last selected point back to starting point
        this.naiveSolutionDistance += calcDistance(current_point, this.startingPoint);
        return naiveSolution;
    }

    private calculateDistances(points: Point[]) {
        let distances: number[][] = new Array(points.length);
        for(let p=0; p<points.length; p++)
            distances[p] = new Array(points.length).fill(0);

        for(let y=0; y<points.length; y++) {
            for(let x=0; x<points.length; x++) {
                let dst = x === y ? 0 : calcDistance(points[x], points[y]);
                distances[x][y] = dst;
            }
        }

        return distances;
    }

    public getDistance(p1_index: number, p2_index: number) {
        return this.cachedDistances[p1_index][p2_index];
    }

    public getNaiveSolution() {
        return this.naiveSolution;
    }

    public getNaiveSolutionDistance() {
        return this.naiveSolutionDistance;
    }
}
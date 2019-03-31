import Network, {BrainParams} from './network';
import Buffer1D, {BufferParams} from './buffer1d';

export enum StructureType {
	Network, Buffer1D
}

function isBufferParams(p: any): p is BufferParams {
	return typeof p.length === 'number';
}

function isBrainParams(p: any): p is BrainParams {
	return typeof p.inputs === 'number' && typeof p.outputs === 'number';
}

const FITNESS_DISSOLVE = 2;

/** Used by genetic algorithm */
export default class Individual {
	private brain: Network | Buffer1D;
	private params: BrainParams | BufferParams;
	private score = 0;
	public fitness = 0;
	public total_fitness_norm = 0;//normalized total fitness
	public parent_fitnesses = [0, 0];
	
	readonly type: StructureType;

	constructor(params: BrainParams | BufferParams) {
		this.params = params;

		if(isBufferParams(params)) {
			this.brain = new Buffer1D(params);
			this.type = StructureType.Buffer1D;
		}
		else if(isBrainParams(params)) {
			this.brain = new Network(params);
			this.type = StructureType.Network;
		}
		else throw new Error('Cannot find corresponding type for params argument');
	}

	clone() {
		let copy = new Individual(this.params);
		//copy.brain.copyWeights( this.brain.getWeights() );
		copy.brain = this.brain.clone();
		return copy;
	}

	getMemoryUsed() {
		return this.brain.memory_used;
	}

	setScore(value: number) {
		this.score = value;
	}

	getScore() {
		return this.score;
	}

	getTotalFitness() {
		return this.fitness + (this.parent_fitnesses[0]+this.parent_fitnesses[1]) * FITNESS_DISSOLVE;
	}

	//only for neural networks
	action(input: number[] | Float32Array) {
		if(this.type !== StructureType.Network)
			throw new Error('This function can be used only for neural network structure');

		if(input.length !== (<BrainParams>this.params).inputs)
			throw new Error('Incorrect number of input values');
		return (<Network>this.brain).calculateOutput(input);
	}

	//only for buffer1d
	getData() {
		if(this.type !== StructureType.Buffer1D)
			throw new Error('This function can be used only for buffer1d structure');
		return (<Buffer1D>this.brain).getValues();
	}

	private mutateArray(buff: Float32Array, mutation_chance: number, mutation_scale: number) {
		for(let i=0; i<buff.length; i++) {
			if(Math.random() < mutation_chance)
				buff[i] += Math.random() * (Math.random()*2 - 1) * mutation_scale;
		}
	}

	public mutate(mutation_chance: number, mutation_scale: number) {
		if(this.type === StructureType.Network) {
			for(let weights of (<Network>this.brain).getWeights())
				this.mutateArray(weights, mutation_chance, mutation_scale);
		}
		else if(this.type === StructureType.Buffer1D) {
			this.mutateArray((<Buffer1D>this.brain).getValues(), mutation_chance, mutation_scale);
			//(<Buffer1D>this.brain).clamp(-1, 1);
		}
	}

	private static crossoverArray(target: Float32Array, 
		parent1: Float32Array, parent2: Float32Array, splits: number) 
	{
		let split_points: number[] = [];
		for(let i=0; i<splits; i++)
			split_points.push( (target.length * Math.random())|0 );
		split_points = split_points.sort((a, b) => a-b)
			.filter((v, i, arr) => arr.indexOf(v, i+1) === -1);
		
		let parents_dna = [parent1, parent2];
		let start = 0;
		for(var j=0; j<split_points.length; j++) {
			//console.log(start, split_points[j], j%2);
			for(let i=start; i<split_points[j]; i++)
				target[i] = parents_dna[j%2][i];
			start = split_points[j];
		}
		//console.log(start, target.length, j%2);
		for(let i=start; i<target.length; i++)
			target[i] = parents_dna[j%2][i];
		
		/*let split = (target.length * Math.random())|0;
		for(let i=0; i<split; i++)
			target[i] = src1[i];
		for(let i=split; i<target.length; i++)
			target[i] = src2[i];*/
	}

	public static crossover(A: Individual, B: Individual, flip_chance: number, splits: number) {
		if(A.type !== B.type)
			throw new Error('Incopatible structures');

		let child = new Individual(A.params);

		if(A.type === StructureType.Network) {
			//@ts-ignore
			if(A.params.inputs !== B.params.inputs || A.params.outputs !== B.params.outputs)
				throw new Error('Incopatible individuals');

			let w1 = (<Network>A.brain).getWeights();
			let w2 = (<Network>B.brain).getWeights();
			
			let weights = (<Network>child.brain).getWeights();

			for(let l=0; l<weights.length; l++) {
				if(Math.random() < flip_chance) {//flip parents dna
					let swap = w1;
					w1 = w2;
					w2 = swap;
				}
				Individual.crossoverArray(weights[l], w1[l], w2[l], splits);
			}
		}
		else if(A.type === StructureType.Buffer1D) {
			let v1 = (<Buffer1D>A.brain).getValues();
			let v2 = (<Buffer1D>B.brain).getValues();

			if(Math.random() < flip_chance) {//flip parents dna
				let swap = v1;
				v1 = v2;
				v2 = swap;
			}

			let chV = (<Buffer1D>child.brain).getValues();

			Individual.crossoverArray(chV, v1, v2, splits);
		}

		child.parent_fitnesses = [A.fitness, B.fitness];
		return child;
	}
}
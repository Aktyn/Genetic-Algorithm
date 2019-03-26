import Network, {ActivationFunctions} from './network';

const FITNESS_DISSOLVE = 2;

export interface BrainParams {
	inputs: number;
	hidden_layers: number[];
	outputs: number;
}

/** Used by genetic algorithm */
export default class Individual {
	private brain: Network;
	private params: BrainParams;
	private score = 0;
	public fitness = 0;
	public total_fitness_norm = 0;//normalized total fitness
	public parent_fitnesses = [0, 0];
	private activation_function: (x: number)=>number;

	constructor(params: BrainParams, activation = ActivationFunctions.sigmoid) {
		this.activation_function = activation;
		this.params = params;
		this.brain = new Network(params.inputs, params.hidden_layers, params.outputs);
	}

	clone() {
		let copy = new Individual(this.params, this.activation_function);
		copy.brain.copyWeights( this.brain.getWeights() );
		return copy;
	}

	setScore(value: number) {
		this.score = value;
	}

	getScore() {
		return this.score;
	}

	getTotalFitness() {
		return this.fitness + (this.parent_fitnesses[0] + this.parent_fitnesses[1]) * FITNESS_DISSOLVE;
	}

	action(input: number[] | Float32Array) {
		if(input.length !== this.params.inputs)
			throw new Error('Incorrect number of input values');
		return this.brain.calculateOutput(input, this.activation_function);
	}

	public mutate(mutation_chance = 0.1, mutation_scale = 0.5) {
		for(let weights of this.brain.getWeights()) {
			for(let i=0; i<weights.length; i++) {
				if(Math.random() < mutation_chance)
					weights[i] += Math.random() * (Math.random()*2 - 1) * mutation_scale;
			}
		}
	}

	public static crossover(A: Individual, B: Individual) {
		if(A.params.inputs !== B.params.inputs || A.params.outputs !== B.params.outputs)
			throw new Error('Incopatible individuals');

		let w1 = A.brain.getWeights();
		let w2 = B.brain.getWeights();

		let child = new Individual(A.params, A.activation_function);
		let weights = child.brain.getWeights();

		for(let l=0; l<weights.length; l++) {
			if(Math.random() > 0.5) {//flip parents dna
				let swap = w1;
				w1 = w2;
				w2 = swap;
			}

			let split = (weights[l].length * Math.random())|0;
			for(let i=0; i<split; i++)
				weights[l][i] = w1[l][i];
			for(let i=split; i<weights[l].length; i++)
				weights[l][i] = w2[l][i];
		}

		child.parent_fitnesses = [A.fitness, B.fitness];

		return child;
	}
}
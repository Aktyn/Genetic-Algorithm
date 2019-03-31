import Individual from './individual';
import {BrainParams} from './network';
export {ActivationFunctions} from './network';

import {BufferParams} from './buffer1d';

interface ParamsBase {
	mutation_chance: number;
	mutation_scale: number;
	dna_splits: number;
	dna_twist_chance: number;
	elitism: number;
}

export default class GA {
	private individuals: Individual[];//population
	public generation = 0;

	public best_score = 0;

	private params: ParamsBase;

	constructor(population: number, params: Partial<ParamsBase> = {}, 
		individual_params: BrainParams | BufferParams) 
	{
		this.params = {
			mutation_chance: params.mutation_chance || 0.1, 
			mutation_scale: params.mutation_scale || 0.5,
			dna_splits: params.dna_splits || 1,
			dna_twist_chance: params.dna_twist_chance || 0.5,
			elitism: params.elitism || 2
		};

		this.individuals = [];
		for(let i=0; i<population; i++)
			this.individuals.push( new Individual(individual_params) );
	}

	getIndividuals() {
		return this.individuals;
	}

	getBest() {
		return this.individuals[0];
	}

	private selection() {
		//let g = Math.random() * Math.random();
        //return this.individuals[(g*this.individuals.length)|0];

        ////////////////////////////////////////////////////////////////////////

        /*let r = Math.random();

        for(let i=this.individuals.length-1; i>=0; i--) {
        	if(this.individuals[i].fitness >= r)
        		return this.individuals[i];
        }
        return this.individuals[0];*/

        ////////////////////////////////////////////////////////////////////////

        let index = 0;
        let r = Math.random();
        while (r > 0) {
            r -= this.individuals[index].total_fitness_norm;
            index += 1;
        }

        index -= 1;

        return this.individuals[index];
	}

	evolve() {
		this.generation++;

		this.best_score = Number.MIN_SAFE_INTEGER;
		for(let individual of this.individuals)
			this.best_score = Math.max(this.best_score, individual.getScore());

		for(let individual of this.individuals)
			individual.fitness = individual.getScore() / this.best_score;

		let max_total_fitness = Number.MIN_SAFE_INTEGER;
		for(let individual of this.individuals)
			max_total_fitness = Math.max(max_total_fitness, individual.getTotalFitness());

		for(let individual of this.individuals)
			individual.total_fitness_norm = individual.getTotalFitness() / max_total_fitness;

		//sort desc
		this.individuals = this.individuals.sort((a, b) => 
			b.total_fitness_norm - a.total_fitness_norm);

		let new_generation: Individual[] = [];

		for(let i=0; i<this.params.elitism; i++)
			new_generation.push(this.individuals[i].clone());

        //breeding new generation
        for (let i=this.params.elitism; i<this.individuals.length; i++) {
           	let child = Individual.crossover(this.selection(), this.selection(), 
           		this.params.dna_twist_chance, this.params.dna_splits);
            child.mutate(this.params.mutation_chance, this.params.mutation_scale);
           
          	new_generation.push(child);
        }

        this.individuals = new_generation;
	}
}
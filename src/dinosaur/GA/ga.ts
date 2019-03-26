import Individual, {BrainParams} from './individual';
export {ActivationFunctions} from './network';
//import {ActivationFunctions} from './network';//tmp for tests

export default class GA {
	private individuals: Individual[];//population
	private elitism = 2;//preserves N best individuals into next generation
	public generation = 0;

	public best_score = 0;

	constructor(population: number, network_params: BrainParams, activation: (x: number)=>number) {
		this.individuals = [];
		for(let i=0; i<population; i++)
			this.individuals.push( new Individual(network_params, activation) );
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

		for(let i=0; i<this.elitism; i++)
			new_generation.push(this.individuals[i].clone());

        //breeding new generation
        for (let i=this.elitism; i<this.individuals.length; i++) {
           	let child = Individual.crossover(this.selection(), this.selection());
            child.mutate();
           
          	new_generation.push(child);
        }

        this.individuals = new_generation;
	}
}

/*(() => {
	console.log('test');

	function randomColor() {
		return [Math.random(), Math.random(), Math.random()];
	}

	const POP = 50;
	const EPOCHS = 100000;
	const ITERATIONS_PER_EPOCH = 5;

	let ga = new GA(POP, {
		inputs: 3,
		hidden_layers: [10],
		outputs: 3
	}, ActivationFunctions.sigmoid);

	for(let i=0; i<EPOCHS; i++) {//epochs
		let max_score = 0, avg_score = 0;
		for(let individual of ga.getIndividuals()) {
			let score = 0;

			for(let iteration=0; iteration<ITERATIONS_PER_EPOCH; iteration++) {
				let c = randomColor();
				let predicted_negative = individual.action(c);
				for(let ci=0; ci<3; ci++)
					score += 1 - Math.abs( (1.0 - c[ci]) - predicted_negative[ci] );
			}

			if(score > max_score)
				max_score = score;
			avg_score += score;
			individual.setScore(score);
		}
		if(i < EPOCHS-1)
			ga.evolve();

		if(i%100 === 0)
			console.log('evolved', max_score, avg_score / ga.getIndividuals().length);
	}

	let best = ga.getBest();
	console.log( best.action([0.9, 0.5, 0.1]) );
})();*/
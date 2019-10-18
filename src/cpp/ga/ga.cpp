#include "ga.h"
#include "utils.h"
#include <cfloat>
#include <algorithm>
#include <cmath>

GA::GA(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance,
	float parent_fitness_scale, uint32 elitism
):
	HeapPopulation(),
	generation(0),
	best_score( -FLT_MAX ),
	params( {mutation_chance, mutation_scale, dna_splits, dna_twist_chance, parent_fitness_scale, elitism} )
{
	Utils::initRandom();
}

GA::~GA() = default;

uint32 GA::getGeneration() const {
	return generation;
}

float GA::getBestScore() const {
	return best_score;
}

/*Individual* GA::selection(HeapPopulation::Species& species) const {
	const uint32 population = species.populationSize();

	uint32 index = (uint32)((float)Utils::randomInt32(0, population) * 
		Utils::randFloat() * Utils::randFloat());
   	float r = Utils::randFloat();
   	while(r > 0 && index < population) {
       	r -= species[index]->total_fitness_norm;
		index++;
	}

	index--;
	return species[index];
}*/

Individual* GA::tournament_selection(HeapPopulation::Species& species, uint32 tournament_size,
	float selection_probability) const
{
	const uint32 population = species.populationSize();

	Individual* selected[tournament_size];
	for(uint32 i=0; i<tournament_size; i++) {
		uint16 attempts = 0;
		do {
			selected[i] = species[ Utils::randomInt32(0, population-1) ];
			attempts++;
		} while(
			Utils::randomInt16(0, tournament_size*3) < selected[i]->tournament_selections &&
			attempts < 8
		);

		selected[i]->tournament_selections++;
	}

	std::sort(&selected[0], &selected[tournament_size], [](const Individual* a, const Individual* b) -> bool
	{//DESC
	    return a->total_fitness_norm > b->total_fitness_norm;
	});

	float prob = Utils::randFloat();
	float p = selection_probability;//initial probability
	for(uint32 i=0; i<tournament_size; i++) {
		if( prob < selection_probability )
			return selected[i];
		selection_probability += p * powf(1.f - p, (float)(i+1));
	}
	return selected[tournament_size-1];//return worst one from selected individuals
}

void GA::evolveSpecies(HeapPopulation::Species& species, uint32 tournament_size, 
	float selection_probability) 
{
	const uint32 population = species.populationSize();

	//find best individual's score
	float best_species_score = -FLT_MAX;
	for(uint32 i=0; i<population; i++)
		best_species_score = MAX( best_species_score, species[i]->getScore() );

	this->best_score = MAX(this->best_score, best_species_score);

	float max_total_fitness = -FLT_MAX;
	for(uint32 i=0; i<population; i++) {
		species[i]->fitness = species[i]->getScore() / best_species_score;//normalize fitness
		if( species[i]->fitness != species[i]->fitness )//fix NaN
			species[i]->fitness = 0.f;
		max_total_fitness = MAX( max_total_fitness, species[i]->getTotalFitness(params.parent_fitness_scale) );
	}

	for(uint32 i=0; i<population; i++) {
		species[i]->total_fitness_norm =
			species[i]->getTotalFitness(params.parent_fitness_scale) / max_total_fitness;
		if( species[i]->total_fitness_norm != species[i]->total_fitness_norm )//fix NaN
			species[i]->total_fitness_norm = 0.f;
	}

	species.sortByTotalFitnessNorm();

	//TEMP: test of sorting (DESC)
	//FOR_EACH_INDIVIDUAL
	//	printf("sorting test: %d => %f\n", i, species[i]->total_fitness_norm);

	//Individual** new_generation = new Individual*[population];
	species.clearIndividualsArray(species.swap_individuals);

	for(uint32 i=0; i<params.elitism && i < population; i++) {
		species[i]->tournament_selections = 0;//reset elite individuals before running selection algorithm
		species.swap_individuals[i] = species[i]->clone_ptr();//species[i];
	}

    //breeding new generation
    for(uint32 i=params.elitism; i<population; i++) {
        Individual* parentA = nullptr;
        Individual* parentB = nullptr;

        do {//prevent from selecting same individual
			//parentA = this->selection(species);
			//parentB = this->selection(species);
            parentA = this->tournament_selection(species, tournament_size, selection_probability);
            parentB = this->tournament_selection(species, tournament_size, selection_probability);
        } while( parentA == parentB );

        Individual* child = this->crossover(*parentA, *parentB);
		this->mutate( *child );
        species.swap_individuals[i] = child;
    }

	//clear previous generation memory before swapping it
	/*for(uint32 i=params.elitism; i<population; i++) {//skip copied individuals to new generation
		if( species[i] != nullptr )
			delete species[i];
	}*/
	//delete[] individuals;
    //individuals = new_generation;
    species.swapArrays();
}

void GA::evolve(uint32 tournament_size, float selection_probability, uint32 max_species,
	float split_species_probability, float merge_species_probability)
{
	if( species_heap.empty() ) {
	    printf("Error: No population initialized");
        throw std::exception();
    }
	this->generation++;
	best_score = -FLT_MAX;

	//evolve each species separately
	for(uint32 i=FIRST_LEAF_INDEX; i<(uint32)species_heap.size(); i++)
		evolveSpecies(*species_heap[i], tournament_size, selection_probability);

	bool split = Utils::randFloat() < split_species_probability;
	bool merge = Utils::randFloat() < merge_species_probability;

	if(split != merge) {
		if(split && HeapPopulation::getNumberOfSpecies() < max_species)
			HeapPopulation::split();
		if(merge)
			HeapPopulation::merge();
	}
}
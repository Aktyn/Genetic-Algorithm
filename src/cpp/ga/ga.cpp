#include "ga.h"
#include "utils.h"
#include <stdio.h>
#include <float.h>//DBL_MAX
#include <algorithm>

#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define FOR_EACH_INDIVIDUAL for(uint32 i=0; i<population; i++)

GA::GA(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance, uint32 elitism
):
	generation(0),
	best_score( -FLT_MAX ),
	population(0),
	params( {mutation_chance, mutation_scale, dna_splits, dna_twist_chance, elitism} ),
	individuals( nullptr )
{
	Utils::initRandom();
}

GA::~GA() {
	if( individuals != nullptr ) {
		FOR_EACH_INDIVIDUAL {
			if( individuals[i] )
				delete individuals[i];
		}
		delete[] individuals;
	}
}

uint32 GA::getGeneration() const {
	return generation;
}

float GA::getBestScore() const {
	return best_score;
}

void GA::initPopulation(uint32 _population) {
	this->population = _population;

	this->individuals = new Individual*[population];
	FOR_EACH_INDIVIDUAL {
		this->individuals[i] = this->createIndividual();
	}
}

Individual* GA::selection() const {
	uint32 index = 0;
    float r = Utils::randFloat();
    while(r > 0 && index < population) {
        r -= individuals[index]->total_fitness_norm;
		index++;
	}

	index--;
	return individuals[index];
}

void GA::evolve() {
	if( individuals == nullptr )
		throw "No population initialized";
	this->generation++;

	//find best individual's score
	best_score = -FLT_MAX;
	FOR_EACH_INDIVIDUAL
		best_score = MAX( best_score, individuals[i]->getScore() );

	float max_total_fitness = -FLT_MAX;
	FOR_EACH_INDIVIDUAL {
		individuals[i]->fitness = individuals[i]->getScore() / best_score;//normalize fitness
		if( individuals[i]->fitness != individuals[i]->fitness )//fix NaN
			individuals[i]->fitness = 0.f;
		max_total_fitness = MAX( max_total_fitness, individuals[i]->getTotalFitness() );
	}

	FOR_EACH_INDIVIDUAL {
		individuals[i]->total_fitness_norm = individuals[i]->getTotalFitness() / max_total_fitness;
		if( individuals[i]->total_fitness_norm != individuals[i]->total_fitness_norm )
			individuals[i]->total_fitness_norm = 0.f;
	}

	std::sort(&individuals[0], &individuals[population], [](const Individual* a, const Individual* b) -> bool
	{
	    return a->total_fitness_norm > b->total_fitness_norm;
	});

	//TEMP: test of sorting (DESC)
	//FOR_EACH_INDIVIDUAL
	//	printf("sorting test: %d => %f\n", i, individuals[i]->total_fitness_norm);


	//TODO: store two arrays of individuals and swap them each epoch instead of reallocating memory every time
	Individual** new_generation = new Individual*[population];
	//uint32 push_i = 0;

	for(uint32 i=0; i<params.elitism; i++)                //TODO: no need to clone first few individuals
		new_generation[/*push_i++*/i] = individuals[i]->clone_ptr(); //they may be just skipped during memory cleaning

    //breeding new generation
    for(uint32 i=params.elitism; i<population; i++) {
        Individual* child = this->crossover( *this->selection(), *this->selection() );
		this->mutate( *child );
        new_generation[i] = child;
    }

	//clear previous generation memory before swapping it
	FOR_EACH_INDIVIDUAL {
		if( individuals[i] != nullptr )
			delete individuals[i];
	}
    individuals = new_generation;
}
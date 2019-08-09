#ifndef BUFFER_EVOLUTION_H
#define BUFFER_EVOLUTION_H

#include "ga.h"
#include "buffer_individual.h"

#define DEFAULT_MUTATION_CHANCE 0.1f
#define DEFAULT_MUTATION_SCALE 0.5f
#define DEFAULT_DNA_SPLITS 20//2
#define DEFAULT_DNA_TWIST_CHANCE 0.5f
#define DEFAULT_ELITISM 1

class BufferEvolution final : public GA {
	private:
		uint32 buffer_size;

		Individual* createIndividual() const;
		Individual* crossover(const Individual& parentA, const Individual& parentB) const;
		void mutate(Individual& child) const;
	public:
		BufferEvolution(
			float mutation_chance = DEFAULT_MUTATION_CHANCE,
			float mutation_scale = DEFAULT_MUTATION_SCALE,
			uint32 dna_splits = DEFAULT_DNA_SPLITS,
			float dna_twist_chance = DEFAULT_DNA_TWIST_CHANCE,
			uint32 elitism = DEFAULT_ELITISM
		);
		~BufferEvolution();

		void initPopulation(uint32 population_size, uint32 buffer_size);
		//BufferIndividual** getIndividuals() const; //not supported
		BufferIndividual* getIndividual(uint32 index) const;
};

#endif
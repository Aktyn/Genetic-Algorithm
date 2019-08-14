#ifndef BUFFER_EVOLUTION_H
#define BUFFER_EVOLUTION_H

#include "ga.h"
#include "buffer_individual.h"

class BufferEvolution final : public GA {
	private:
		uint32 buffer_size;

		Individual* createIndividual() const override;
		Individual* crossover(const Individual& parentA, const Individual& parentB) const override;
		void mutate(Individual& child) const override;
	public:
		explicit BufferEvolution(
			float mutation_chance = DEFAULT_MUTATION_CHANCE,
			float mutation_scale = DEFAULT_MUTATION_SCALE,
			uint32 dna_splits = DEFAULT_DNA_SPLITS,
			float dna_twist_chance = DEFAULT_DNA_TWIST_CHANCE,
			float parent_fitness_scale = DEFAULT_PARENT_FITNESS_SCALE,
			uint32 elitism = DEFAULT_ELITISM
		);
		~BufferEvolution() override;

		void initPopulation(uint32 population_size, uint32 buffer_size);

		BufferIndividual* getIndividual(uint32 index) const override;
};

#endif
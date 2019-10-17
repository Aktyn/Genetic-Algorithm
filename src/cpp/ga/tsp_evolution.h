#ifndef TSP_EVOLUTION_H
#define TSP_EVOLUTION_H

#include "ga.h"
#include "tsp_individual.h"

class TspEvolution final : public GA {
	private:
		uint32 buffer_size;

		Individual* createIndividual() const override;
		Individual* crossover(const Individual& parentA, const Individual& parentB) const override;
		void mutate(Individual& child) const override;
	public:
		explicit TspEvolution(
			float mutation_chance = DEFAULT_MUTATION_CHANCE,
			float mutation_scale = DEFAULT_MUTATION_SCALE,
			uint32 dna_splits = DEFAULT_DNA_SPLITS,
			float dna_twist_chance = DEFAULT_DNA_TWIST_CHANCE,
			float parent_fitness_scale = DEFAULT_PARENT_FITNESS_SCALE,
			uint32 elitism = DEFAULT_ELITISM
		);
		~TspEvolution() override;

		void initPopulation(uint32 population_size, uint32 buffer_size);

		TspIndividual* getIndividual(uint32 index) const override;
};

#endif
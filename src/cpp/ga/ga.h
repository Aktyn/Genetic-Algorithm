#ifndef GENETIC_ALGORITHM_HPP
#define GENETIC_ALGORITHM_HPP

#include "individual.h"

class GA {
	private:
		struct Params {
			float mutation_chance;
			float mutation_scale;
			uint32 dna_splits;
			float dna_twist_chance;
			uint32 elitism;
		};

		uint32 generation, population;
		float best_score;

		Individual* selection() const;
	protected:
		Params params;
		Individual** individuals;//array of pointers

		virtual Individual* createIndividual() const = 0;
		virtual Individual* crossover(const Individual& parentA, const Individual& parentB) const = 0;
		virtual void mutate(Individual& child) const = 0;
	public:
		GA(float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance, uint32 elitism);
		virtual ~GA();

		virtual void initPopulation(uint32 population_size);
		void evolve();

		uint32 getGeneration() const;
		float getBestScore() const;
};

#endif
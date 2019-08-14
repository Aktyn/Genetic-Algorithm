#ifndef GENETIC_ALGORITHM_HPP
#define GENETIC_ALGORITHM_HPP

#include "heap_population.h"

//defines used in child classes
#define DEFAULT_MUTATION_CHANCE 0.1f
#define DEFAULT_MUTATION_SCALE 0.5f
#define DEFAULT_DNA_SPLITS 20//2
#define DEFAULT_DNA_TWIST_CHANCE 0.5f
#define DEFAULT_PARENT_FITNESS_SCALE 2.f
#define DEFAULT_ELITISM 1

class GA : public HeapPopulation {
	private:
		struct Params {
			float mutation_chance;
			float mutation_scale;
			uint32 dna_splits;
			float dna_twist_chance;
			float parent_fitness_scale;
			uint32 elitism;
		};

		uint32 generation;
		float best_score;

		Individual* tournament_selection(HeapPopulation::Species& species,
			uint32 tournament_size, float selection_probability) const;
		void evolveSpecies(HeapPopulation::Species& species, uint32 tournament_size, float selection_probability);
	protected:
		Params params;

		virtual Individual* crossover(const Individual& parentA, const Individual& parentB) const = 0;
		virtual void mutate(Individual& child) const = 0;
	public:
		GA(float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance,
			float parent_fitness_scale, uint32 elitism);
		virtual ~GA();

		void evolve(uint32 tournament_size, float selection_probability, uint32 max_species = 8,
			float split_species_probability = 0.2f, float merge_species_probability = 0.2f);

		uint32 getGeneration() const;
		float getBestScore() const;
};

#endif
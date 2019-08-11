#ifndef NETWORK_EVOLUTION_HPP
#define NETWORK_EVOLUTION_HPP

#include "ga.h"
#include "network_individual.h"
#include <vector>

class NetworkEvolution final : public GA {
	private:
		NetworkIndividual::NetworkParams network_params;

		Individual* createIndividual() const;
		Individual* crossover(const Individual& parentA, const Individual& parentB) const;
		void mutate(Individual& child) const;
	public:
		NetworkEvolution(
			float mutation_chance = DEFAULT_MUTATION_CHANCE,
			float mutation_scale = DEFAULT_MUTATION_SCALE,
			uint32 dna_splits = DEFAULT_DNA_SPLITS,
			float dna_twist_chance = DEFAULT_DNA_TWIST_CHANCE,
			uint32 elitism = DEFAULT_ELITISM
		);
		~NetworkEvolution();

		void initPopulation(uint32 population_size, uint32 inputs, 
			//std::vector<int> hidden_layers, 
			uint32 outputs, NetworkIndividual::ACTIVATION_TYPE activation_func);

		NetworkIndividual* getIndividual(uint32 index) const;
};

#endif
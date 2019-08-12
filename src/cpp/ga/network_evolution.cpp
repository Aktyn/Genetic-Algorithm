#include "network_evolution.h"
#include "utils.h"
#include <stdio.h>

NetworkEvolution::NetworkEvolution(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance,
	float parent_fitness_scale, uint32 elitism
):
	GA(mutation_chance, mutation_scale, dna_splits, dna_twist_chance, parent_fitness_scale, elitism)
{}

NetworkEvolution::~NetworkEvolution() {

}

Individual* NetworkEvolution::createIndividual() const {
	return new NetworkIndividual( network_params );
}

Individual* NetworkEvolution::crossover(const Individual& parentA, const Individual& parentB) const {
	NetworkIndividual* child = new NetworkIndividual( this->network_params );

	const NetworkIndividual& networkA = static_cast<const NetworkIndividual&>(parentA);
	const NetworkIndividual& networkB = static_cast<const NetworkIndividual&>(parentB);

	if(networkA.params.inputs != networkB.params.inputs || networkA.params.outputs != networkB.params.outputs)
		throw "Incompatible individuals";

	float** w1 = networkA.weights;
	float** w2 = networkB.weights;

	for(uint32 l=0; l<child->layer_nodes.size()-1; l++) {
		uint32 weights_size = child->layer_nodes[l] * child->layer_nodes[l+1];
		if(Utils::randFloat() < GA::params.dna_twist_chance)
			Utils::crossoverBuffers(child->weights[l], w2[l], w1[l], weights_size, GA::params.dna_splits);
		else
			Utils::crossoverBuffers(child->weights[l], w1[l], w2[l], weights_size, GA::params.dna_splits);
	}

	child->parent_fitnesses[0] = parentA.fitness;
	child->parent_fitnesses[1] = parentB.fitness;

	return child;
}

void NetworkEvolution::mutate(Individual& child) const {
	NetworkIndividual& net_child = static_cast<NetworkIndividual&>(child);
	for(uint32 l=0; l<net_child.layer_nodes.size()-1; l++) {
		uint32 weights_size = net_child.layer_nodes[l] * net_child.layer_nodes[l+1];
		Utils::mutateBuffer(net_child.weights[l], weights_size,
			GA::params.mutation_chance, GA::params.mutation_scale);
	}
}

void NetworkEvolution::initPopulation(uint32 population, uint32 inputs, std::vector<uint32> hidden_layers,
	uint32 outputs, activation::FUNCTION activation_func)
{
	network_params = {inputs, hidden_layers, outputs, activation_func};
	GA::initPopulation(population);
}

NetworkIndividual* NetworkEvolution::getIndividual(uint32 index) const {
	return (NetworkIndividual*)individuals[index];
}

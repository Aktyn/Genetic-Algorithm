#include "network_evolution.h"
#include "utils.h"
#include <stdio.h>

NetworkEvolution::NetworkEvolution(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance, uint32 elitism
):
	GA(mutation_chance, mutation_scale, dna_splits, dna_twist_chance, elitism)
{}

NetworkEvolution::~NetworkEvolution() {

}

Individual* NetworkEvolution::createIndividual() const {
	return new NetworkIndividual( network_params );
}

Individual* NetworkEvolution::crossover(const Individual& parentA, const Individual& parentB) const {
	/*NetworkIndividual* child = new NetworkIndividual( this->buffer_size, nullptr );
	float* bufferA = static_cast<const NetworkIndividual&>(parentA).getBuffer();
	float* bufferB = static_cast<const NetworkIndividual&>(parentB).getBuffer();

	if( Utils::randFloat() < GA::params.dna_twist_chance ) {
		float* swap = bufferA;
		bufferA = bufferB;
		bufferB = swap;
	}

	float* child_buffer = child->getBuffer();

	Utils::crossoverBuffers(child_buffer, bufferA, bufferB, buffer_size, GA::params.dna_splits);

	child->parent_fitnesses[0] = parentA.fitness;
	child->parent_fitnesses[1] = parentB.fitness;

	return child;*/
	return nullptr;
}

void NetworkEvolution::mutate(Individual& child) const {
	//float* buffer = static_cast<NetworkIndividual&>(child).getBuffer();
	//Utils::mutateBuffer(buffer, buffer_size, params.mutation_chance, params.mutation_scale);
}

void NetworkEvolution::initPopulation(uint32 population, uint32 inputs,/*std::vector<int> hidden_layers,*/
	uint32 outputs, NetworkIndividual::ACTIVATION_TYPE activation_func)
{
	network_params = {inputs, /*hidden_layers,*/ outputs, activation_func};
	GA::initPopulation(population);
}

NetworkIndividual* NetworkEvolution::getIndividual(uint32 index) const {
	return (NetworkIndividual*)individuals[index];
}

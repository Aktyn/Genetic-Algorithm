#include "tsp_evolution.h"
#include "utils.h"
#include <cstdio>

TspEvolution::TspEvolution(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance,
	float parent_fitness_scale, uint32 elitism
):
	GA(mutation_chance, mutation_scale, dna_splits, dna_twist_chance, parent_fitness_scale, elitism),
	buffer_size(0)
{}

TspEvolution::~TspEvolution() = default;

Individual* TspEvolution::createIndividual() const {
	return new TspIndividual( this->buffer_size );
}

Individual* TspEvolution::crossover(const Individual& parentA, const Individual& parentB) const {
	auto* child = new TspIndividual( this->buffer_size, nullptr );
	uint32* bufferA = dynamic_cast<const TspIndividual&>(parentA).getBuffer();
	uint32* bufferB = dynamic_cast<const TspIndividual&>(parentB).getBuffer();

	if( Utils::randFloat() < GA::params.dna_twist_chance ) {
		uint32* swap = bufferA;
		bufferA = bufferB;
		bufferB = swap;
	}

	uint32* child_buffer = child->getBuffer();
	Utils::orderedCrossover(child_buffer, bufferA, bufferB, buffer_size, GA::params.dna_splits);

	child->parent_fitnesses[0] = parentA.fitness;
	child->parent_fitnesses[1] = parentB.fitness;

	return child;
}

void TspEvolution::mutate(Individual& child) const {
	uint32* buffer = dynamic_cast<TspIndividual&>(child).getBuffer();
	Utils::swapMutation(buffer, buffer_size, params.mutation_chance);
}

void TspEvolution::initPopulation(uint32 population, uint32 _buffer_size) {
	this->buffer_size = _buffer_size;//must be assigned before initializing population
	GA::initPopulation(population);
}

TspIndividual* TspEvolution::getIndividual(uint32 index) const {
	return (TspIndividual*)( HeapPopulation::getIndividual(index) );
}

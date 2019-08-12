#include "buffer_evolution.h"
#include "utils.h"
#include <stdio.h>

BufferEvolution::BufferEvolution(
	float mutation_chance, float mutation_scale, uint32 dna_splits, float dna_twist_chance,
	float parent_fitness_scale, uint32 elitism
):
	GA(mutation_chance, mutation_scale, dna_splits, dna_twist_chance, parent_fitness_scale, elitism),
	buffer_size(0)
{}

BufferEvolution::~BufferEvolution() {

}

Individual* BufferEvolution::createIndividual() const {
	return new BufferIndividual( this->buffer_size );
}

Individual* BufferEvolution::crossover(const Individual& parentA, const Individual& parentB) const {
	BufferIndividual* child = new BufferIndividual( this->buffer_size, nullptr );
	float* bufferA = static_cast<const BufferIndividual&>(parentA).getBuffer();
	float* bufferB = static_cast<const BufferIndividual&>(parentB).getBuffer();

	if( Utils::randFloat() < GA::params.dna_twist_chance ) {
		float* swap = bufferA;
		bufferA = bufferB;
		bufferB = swap;
	}

	float* child_buffer = child->getBuffer();

	Utils::crossoverBuffers(child_buffer, bufferA, bufferB, buffer_size, GA::params.dna_splits);

	child->parent_fitnesses[0] = parentA.fitness;
	child->parent_fitnesses[1] = parentB.fitness;

	return child;
}

void BufferEvolution::mutate(Individual& child) const {
	float* buffer = static_cast<BufferIndividual&>(child).getBuffer();
	Utils::mutateBuffer(buffer, buffer_size, params.mutation_chance, params.mutation_scale);
}

void BufferEvolution::initPopulation(uint32 population, uint32 _buffer_size) {
	this->buffer_size = _buffer_size;//must be assigned before initializing population
	GA::initPopulation(population);
}

BufferIndividual* BufferEvolution::getIndividual(uint32 index) const {
	return (BufferIndividual*)individuals[index];
}

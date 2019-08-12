#include "individual.h"

//#define FITNESS_DISSOLVE 2.0f

Individual::Individual():
	score(0.f),
	fitness(0.f),
	total_fitness_norm(0.f),
	tournament_selections(0)
{
	parent_fitnesses[0] = parent_fitnesses[1] = 0.f;
}

Individual::Individual(const Individual& individual) {
	*this = individual;
}

Individual::~Individual() {

}

Individual& Individual::operator=(const Individual& individual) {
	this->score = individual.score;
	this->fitness = individual.fitness;
	this->total_fitness_norm = individual.total_fitness_norm;
	this->parent_fitnesses[0] = individual.parent_fitnesses[0];
	this->parent_fitnesses[1] = individual.parent_fitnesses[1];
	this->tournament_selections = individual.tournament_selections;
	return *this;
}

float Individual::getScore() const {
	return score;
}

float Individual::getTotalFitness(float parent_fitnesses_dissolve) const {
	return fitness + (parent_fitnesses[0] + parent_fitnesses[1]) * parent_fitnesses_dissolve;
}

void Individual::setScore(const float _score) {
	score = _score;
}

void Individual::copyToClone(Individual* clone) const {
	clone->score = this->score;
	clone->fitness = this->fitness;
	clone->total_fitness_norm = this->total_fitness_norm;
	clone->parent_fitnesses[0] = this->parent_fitnesses[0];
	clone->parent_fitnesses[1] = this->parent_fitnesses[1];
	clone->tournament_selections = this->tournament_selections;
}

Individual* Individual::clone_ptr() const {//NOTE that is returns pointer that must be deleted
	Individual* clone = new Individual();
	this->copyToClone(clone);
	return clone;
}
#ifndef INDIVIDUAL_H
#define INDIVIDUAL_H

#include "types.h"

class Individual {
	private:
		float score;
	protected:
		void copyToClone(Individual* clone) const;
		virtual uint32 getMemoryUsed() const {//pseudo abstract
			return 0;
		}
	public:
		float fitness;
		float total_fitness_norm;
		float parent_fitnesses[2];
		uint16 tournament_selections;

		Individual();
		Individual(const Individual& individual);//copy
		virtual ~Individual();

		Individual& operator = (const Individual& individual);

		virtual Individual* clone_ptr() const;

		float getScore() const;
		float getTotalFitness(float parent_fitnesses_dissolve) const;

		void setScore(const float score);
};

#endif
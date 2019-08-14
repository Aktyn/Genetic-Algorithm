#ifndef HEAP_POPULATION_H
#define HEAP_POPULATION_H

#include "individual.h"

#define FIRST_LEAF_INDEX (this->species_heap.size() / 2)
#define NUMBER_OF_SPECIES (1 + species_heap.size() / 2)

class HeapPopulation {
	protected:
		class Species {//basically it is just an array
			private:
				uint32 population;
				Individual** individuals;//array of pointers
				Individual** swap_individuals;

				void destructorCode();
			public:
				explicit Species(uint32 population = 0);
				Species(const Species& species);//copy
				virtual ~Species();

				void clearIndividualsArray(Individual** array = nullptr);
				void copyIndividualsArray(const Individual** source, Individual** target) const;
				void sortByTotalFitnessNorm();
				void swapArrays();

				uint32 populationSize() const;

				Species& operator = (const Species& species);
				const Individual* operator [] (int i) const { return individuals[i]; }
                Individual*& operator [] (int i) { return individuals[i]; }

                //static void swapData(Species& spec1, Species& spec2);

                friend class GA;//needs access to swap_individuals
		};

		uint32 total_population;
		std::vector<Species*> species_heap;

        virtual Individual* getIndividual(uint32 index) const;

		void split();
		void merge();

		virtual Individual* createIndividual() const = 0;
	public:
		HeapPopulation();
		virtual ~HeapPopulation();

		virtual void initPopulation(uint32 total_population_size);

		uint32 getNumberOfSpecies() const;
		void printSpeciesSizes() const;
};

#endif
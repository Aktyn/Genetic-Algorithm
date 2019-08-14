#include "heap_population.h"
#include "utils.h"
#include <cstdio>

HeapPopulation::Species::Species(uint32 _population):
	population(_population)
{
	this->individuals = new Individual*[_population];
	this->swap_individuals = new Individual*[_population];

	for(uint32 i=0; i<_population; i++) {
		this->individuals[i] = nullptr;
		this->swap_individuals[i] = nullptr;
	}
}

HeapPopulation::Species::Species(const HeapPopulation::Species& species): population(0) {//copy
	this->individuals = nullptr;
	this->swap_individuals = nullptr;
	*this = species;
}

HeapPopulation::Species::~Species() {
	destructorCode();
}

void HeapPopulation::Species::destructorCode() {
	clearIndividualsArray(individuals);
	//if(individuals)
		delete[] individuals;

	clearIndividualsArray(swap_individuals);
	//if(swap_individuals)
		delete[] swap_individuals;
}

void HeapPopulation::Species::clearIndividualsArray(Individual** array) {
	if(array == nullptr)
		array = individuals;
	if( array != nullptr ) {
		for(uint32 i=0; i<population; i++) {
			if( array[i] ) {
				delete array[i];
				array[i] = nullptr;
			}
		}
	}
}

void HeapPopulation::Species::copyIndividualsArray(const Individual** source, Individual** target) const {
	for(uint32 i=0; i<population; i++) {
		if(target[i]) {
			printf("44, %u\n", target[i]->tournament_selections);
			delete target[i];
		}

		if(source[i] == nullptr)
			target[i] = nullptr;
		else {
			target[i] = source[i]->clone_ptr();
		}
	}
}

HeapPopulation::Species& HeapPopulation::Species::operator=(const HeapPopulation::Species& species) {
	if(this == &species)
		return *this;
	printf("you should avoid to copy species\n");
	this->population = species.population;

	this->destructorCode();

	if(species.individuals == nullptr)
		this->individuals = nullptr;
	else {
		this->individuals = new Individual*[population];
		this->copyIndividualsArray((const Individual**)species.individuals, this->individuals);
	}

	if(species.swap_individuals == nullptr)
		this->swap_individuals = nullptr;
	else {
		this->swap_individuals = new Individual*[population];
		this->copyIndividualsArray((const Individual**)species.swap_individuals, this->swap_individuals);
	}

	return *this;
}

void HeapPopulation::Species::sortByTotalFitnessNorm() {
	std::sort(&individuals[0], &individuals[population], [](const Individual* a, const Individual* b) -> bool
	{//DESC
	    return a->total_fitness_norm > b->total_fitness_norm;
	});
}

void HeapPopulation::Species::swapArrays() {
	Individual** swap = individuals;
	individuals = swap_individuals;
	swap_individuals = swap;
}

/*void HeapPopulation::Species::swapData(Species& spec1, Species& spec2) {//static
	uint32 population_swap = spec1.population;
	spec1.population = spec2.population;
	spec2.population = population_swap;

	Individual** individuals_swap = spec1.individuals;
	spec1.individuals = spec2.individuals;
	spec2.individuals = individuals_swap;

	Individual** swap_individuals_swap = spec1.swap_individuals;
	spec1.swap_individuals = spec2.swap_individuals;
	spec2.swap_individuals = swap_individuals_swap;
}*/

uint32 HeapPopulation::Species::populationSize() const {
	return population;
}

/////////////////////////////////////////////////////////////////////////

HeapPopulation::HeapPopulation():
	total_population(0),
	species_heap({})
{

}

HeapPopulation::~HeapPopulation() {
	species_heap.clear();
}

void HeapPopulation::initPopulation(uint32 total_population_size) {
	this->total_population = total_population_size;

	species_heap.clear();//delete every species
	species_heap.push_back( new Species(total_population_size) );//create one species of entire population

	for(uint32 i=0; i<total_population_size; i++)//and fill it
		(*species_heap[0])[i] = this->createIndividual();
}

Individual *HeapPopulation::getIndividual(uint32 index) const {
	for(uint32 i=FIRST_LEAF_INDEX; i<(uint32)species_heap.size(); i++) {
		if( index < species_heap[i]->populationSize() )
			return (*species_heap[i])[index];
		else
			index -= species_heap[i]->populationSize();
	}
	throw std::exception();//"Index out of bounds";
}

uint32 HeapPopulation::getNumberOfSpecies() const {
	return NUMBER_OF_SPECIES;
}

void HeapPopulation::printSpeciesSizes() const {
	for(Species* species : species_heap) {
		if(species != nullptr)
			printf("%u ", species->populationSize());
		//else
		//	printf("null ");
	}
	printf("\n");
}

void HeapPopulation::split() {
	uint32 random_leaf_index = Utils::randomInt32(FIRST_LEAF_INDEX, species_heap.size()-1);
	if(random_leaf_index != FIRST_LEAF_INDEX) {
		//swap selected species data with this in first leaf by swapping array pointers and population size
		//HeapPopulation::Species::swapData( *species_heap[FIRST_LEAF_INDEX], *species_heap[random_leaf_index] );

		//since pointers are in use the swapping is easier
		Species* swap = species_heap[random_leaf_index];
		species_heap[random_leaf_index] = species_heap[FIRST_LEAF_INDEX];
		species_heap[FIRST_LEAF_INDEX] = swap;
	}

	uint32 species_size = species_heap[FIRST_LEAF_INDEX]->populationSize();
	if(species_size < 4)//there is no sense in making single individual species so it should be at least of size 4
		return;

	const uint32 source_leaf_index = FIRST_LEAF_INDEX;
	Species& source = *species_heap[FIRST_LEAF_INDEX];
	//split in half
	uint32 first_half = species_size/2;
	uint32 second_half = species_size - first_half;


	auto* left = new Species(first_half);
	auto* right = new Species(second_half);

	//copy from source
	for(uint32 i=0; i<species_size; i++) {
		if(i < first_half)
			(*left)[i] = source[i]->clone_ptr();
		else
			(*right)[(uint32)(i-first_half)] = source[i]->clone_ptr();
	}

	species_heap.push_back( left );
	species_heap.push_back( right );

	//delete source data since it is fully copied into new leaves
	delete species_heap[source_leaf_index];
	species_heap[source_leaf_index] = nullptr;
}

void HeapPopulation::merge() {
	if( NUMBER_OF_SPECIES <= 1 )
		return;

	uint32 target_index = FIRST_LEAF_INDEX-1;

	uint32 merged_population = 0;

	for(uint8 i=1; i<=2; i++) {
		const uint32 leaf_index = species_heap.size() - i;
		const uint32 random_leaf_index = Utils::randomInt32(FIRST_LEAF_INDEX, species_heap.size()-1);

		if( random_leaf_index < species_heap.size()-2 ) {//swap if none of target leaves was selected
			Species* swap = species_heap[random_leaf_index];
			species_heap[random_leaf_index] = species_heap[ leaf_index ];
			species_heap[ leaf_index ] = swap;
		}
		merged_population += species_heap[leaf_index]->populationSize();
	}

	//merging leaves into parent node and deleting leaves
	auto* merged = new Species(merged_population);
	uint32 insert_index = 0;//inserted individual index handle

	for(uint8 i=0; i<2; i++) {
		const uint32 leaf_index = species_heap.size() - 1;
		for(uint32 j=0; j<species_heap[leaf_index]->populationSize(); j++)
			(*merged)[insert_index++] = (*species_heap[leaf_index])[j]->clone_ptr();

		delete species_heap[leaf_index];
		species_heap[leaf_index] = nullptr;
		species_heap.pop_back();
	}

	if( species_heap[target_index] != nullptr ) {
		printf("Warning! species heap at target_index should be nullptr\n");
		delete species_heap[target_index];
	}
	species_heap[target_index] = merged;
	//erase last two elements in heap
	//species_heap.erase(species_heap.end()-2, species_heap.end());
}

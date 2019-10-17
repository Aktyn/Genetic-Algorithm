#include "tsp_individual.h"
#include "utils.h"

int randomGenerator (uint32 i) {
    return std::rand()%i;
}

TspIndividual::TspIndividual(uint32 _size, uint32_t* source_buffer):
	Individual(), size(_size)
{
	this->array_buff = new uint32_t[size];

	if(source_buffer != nullptr) {//copy from source
		for(uint32 i=0; i<size; i++)
			this->array_buff[i] = source_buffer[i];
	}
	else {//randomize initial values
        //NOTE values must be unique numbers of range from 0 to _size-1
		for(uint32 i=0; i<size; i++)
			this->array_buff[i] = i;//Utils::randomInt32(0, _size-1);
        //shuffle sorted array
        std::random_shuffle ( this->array_buff, &this->array_buff[size], randomGenerator );

        // for(uint32 i=0; i<size; i++)
        //    printf("%u, ", this->array_buff[i]);
        // printf("\n");
	}
}

TspIndividual::TspIndividual(const TspIndividual& individual) {
	*this = individual;
}

TspIndividual::~TspIndividual() {
	if( this->array_buff )
		delete[] this->array_buff;
}

TspIndividual& TspIndividual::operator=(const TspIndividual& individual) {
	if(this == &individual)
		return *this;
	((Individual&)(*this)) = individual;

	this->size = individual.size;
	if(this->array_buff)
		delete[] this->array_buff;
	this->array_buff = new uint32_t[individual.size];
	for(uint32 i=0; i<size; i++)
		this->array_buff[i] = individual.array_buff[i];

	return *this;
}

TspIndividual* TspIndividual::clone_ptr() const {//NOTE this returns pointer that must be deleted
	TspIndividual* clone = new TspIndividual( this->size, this->array_buff );
	Individual::copyToClone(clone);

	return clone;
}

uint32_t* TspIndividual::getBuffer() const {
	return this->array_buff;
}

uint32 TspIndividual::getBufferAddress() const {
	return (uintptr_t)&this->array_buff[0];
}

uint32 TspIndividual::getMemoryUsed() const {//KiB
	return static_cast<uint32>( sizeof(uint32_t) ) * this->size / 1024;
}
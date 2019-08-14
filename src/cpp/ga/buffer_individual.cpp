#include "buffer_individual.h"
#include "utils.h"

BufferIndividual::BufferIndividual(uint32 _size, float* source_buffer):
	Individual(), size(_size)
{
	this->array_buff = new float[size];

	if(source_buffer != nullptr) {//copy from source
		for(uint32 i=0; i<size; i++)
			this->array_buff[i] = source_buffer[i];
	}
	else {//randomize initial values
		for(uint32 i=0; i<size; i++)
			this->array_buff[i] = Utils::randFloat();
	}
}

BufferIndividual::BufferIndividual(const BufferIndividual& individual)/*: Individual(individual)*/ {
	*this = individual;
}

BufferIndividual::~BufferIndividual() {
	if( this->array_buff )
		delete[] this->array_buff;
}

BufferIndividual& BufferIndividual::operator=(const BufferIndividual& individual) {
	if(this == &individual)
		return *this;
	((Individual&)(*this)) = individual;

	this->size = individual.size;
	if(this->array_buff)
		delete[] this->array_buff;
	this->array_buff = new float[individual.size];
	for(uint32 i=0; i<size; i++)
		this->array_buff[i] = individual.array_buff[i];

	return *this;
}

BufferIndividual* BufferIndividual::clone_ptr() const {//NOTE this returns pointer that must be deleted
	BufferIndividual* clone = new BufferIndividual( this->size, this->array_buff );
	Individual::copyToClone(clone);

	return clone;
}

float* BufferIndividual::getBuffer() const {
	return this->array_buff;
}

uint32 BufferIndividual::getBufferAddress() const {
	return (uintptr_t)&this->array_buff[0];
	//return reinterpret_cast<uintptr_t>(&array_buff[0]);
}

uint32 BufferIndividual::getMemoryUsed() const {//KiB
	return static_cast<uint32>( sizeof(float) ) * this->size / 1024;
}
#ifndef BUFFER_1D_H
#define BUFFER_1D_H

#include "individual.h"

class BufferIndividual : public Individual {
	private:
		uint32 size;
		float* array_buff;
	public:
		BufferIndividual(uint32 size, float* source_buffer = nullptr);
		BufferIndividual(const BufferIndividual& individual);//copy
		virtual ~BufferIndividual();

		BufferIndividual& operator = (const BufferIndividual& individual);

		virtual BufferIndividual* clone_ptr() const;

		float* getBuffer() const;
		uint32 getBufferAddress() const;
		uint32 getMemoryUsed() const;
};

#endif
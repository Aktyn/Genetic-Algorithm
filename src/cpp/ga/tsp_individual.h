#ifndef TSP_INDIVIDUAL_H
#define TSP_INDIVIDUAL_H

#include "individual.h"

class TspIndividual : public Individual {
	private:
		uint32 size;
		uint32_t* array_buff;
	public:
		TspIndividual(uint32 size, uint32_t* source_buffer = nullptr);
		TspIndividual(const TspIndividual& individual);//copy
		virtual ~TspIndividual();

		TspIndividual& operator = (const TspIndividual& individual);

		virtual TspIndividual* clone_ptr() const;

		uint32_t* getBuffer() const;
		uint32 getBufferAddress() const;
		uint32 getMemoryUsed() const;
};

#endif
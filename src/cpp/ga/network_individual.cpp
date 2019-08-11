#include "network_individual.h"
#include "utils.h"
#include <math.h>

namespace activation {
	float sigmoid(float x) {
		return 1.f / (1.f + expf(-x));//1 / (1 + e^(-x))
	}
	float tanh(float x) {//(e^x – e^(-x)) / (e^x + e^(-x))
		float ex = expf(x);
		float erev = expf(-x);
		return (ex - erev) / (ex + erev);
	}
}

NetworkIndividual::NetworkIndividual(NetworkParams _params): 
	Individual(),
	params(_params)
{
	
}

NetworkIndividual::NetworkIndividual(const NetworkIndividual& individual) {
	*this = individual;
}

NetworkIndividual::~NetworkIndividual() {
	
}

NetworkIndividual& NetworkIndividual::operator=(const NetworkIndividual& individual) {
	((Individual&)(*this)) = individual;

	//copy stuff here
	this->params = individual.params;

	return *this;
}

NetworkIndividual* NetworkIndividual::clone_ptr() const {//NOTE this returns pointer that must be deleted
	NetworkIndividual* clone = new NetworkIndividual(this->params);
	Individual::copyToClone(clone);

	return clone;
}

uint32 NetworkIndividual::getMemoryUsed() const {//KiB
	return 0;//TODO
}
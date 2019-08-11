#ifndef NETWORK_INDIVIDUAL_H
#define NETWORK_INDIVIDUAL_H

#include "individual.h"
//#include <vector>

namespace activation {
	inline float sigmoid(float x);
	inline float tanh(float x);
}

class NetworkIndividual : public Individual {
	public:
		enum ACTIVATION_TYPE {
			SIGMOID,
			TANH
		};

		struct NetworkParams {//TODO: make exposed class with addHiddenLayer function
			uint32 inputs;
			//std::vector<int> hidden_layers;
			uint32 outputs;
			ACTIVATION_TYPE activation_func;
		};

	private:
		NetworkParams params;
	public:
		NetworkIndividual(NetworkParams params);
		NetworkIndividual(const NetworkIndividual& individual);//copy
		virtual ~NetworkIndividual();

		NetworkIndividual& operator = (const NetworkIndividual& individual);

		virtual NetworkIndividual* clone_ptr() const;

		uint32 getMemoryUsed() const;
};


#endif
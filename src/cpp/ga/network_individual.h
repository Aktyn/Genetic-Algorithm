#ifndef NETWORK_INDIVIDUAL_H
#define NETWORK_INDIVIDUAL_H

#include "individual.h"

namespace activation {
	enum FUNCTION {
		SIGMOID,
		TANH
	};
	inline float sigmoid(float x);
	inline float tanh(float x);

	inline float activate(float x, FUNCTION func);
}

class NetworkIndividual : public Individual {
	public:
		struct NetworkParams {
			uint32 inputs;
			std::vector<uint32> hidden_layers;
			uint32 outputs;
			activation::FUNCTION activation_func;
		};
	private:
		NetworkParams params;
		std::vector<uint32> layer_nodes;

		//2D arrays
		float** nodes;
		float** weights;

		void randomizeWeights();
		void copyWeights(float** source_weights);
		void copyNodeValues(float** source_nodes);
	public:
		NetworkIndividual();
		NetworkIndividual(const NetworkParams& params);
		NetworkIndividual(const NetworkIndividual& individual);//copy
		virtual ~NetworkIndividual();

		NetworkIndividual& operator = (const NetworkIndividual& individual);

		virtual NetworkIndividual* clone_ptr() const;

		uint32 calculateOutput(/*float* input*/uint32 input_address);

		uint32 getMemoryUsed() const;

		friend class NetworkEvolution;
};


#endif
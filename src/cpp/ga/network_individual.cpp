#include "network_individual.h"
#include "utils.h"
#include <math.h>
#include <stdio.h>

namespace activation {
	float sigmoid(float x) {
		return 1.f / (1.f + expf(-x));//1 / (1 + e^(-x))
	}
	float tanh(float x) {//(e^x – e^(-x)) / (e^x + e^(-x))
		float ex = expf(x);
		float erev = expf(-x);
		return (ex - erev) / (ex + erev);
	}

	float activate(float x, FUNCTION func) {
		switch(func) {
			case SIGMOID:   return sigmoid(x);
			case TANH:      return tanh(x);
			default: throw "Unknown activation function";
		}
	}
}

NetworkIndividual::NetworkIndividual():
	nodes(nullptr),
	weights(nullptr),
	params({})
{
	NetworkIndividual({1, {}, 2, activation::SIGMOID});
}

NetworkIndividual::NetworkIndividual(const NetworkParams& _params):
	Individual(),
	params(_params)
{
	layer_nodes = params.hidden_layers;//inputs => 4, |16, 8|, 2  => outputs
	layer_nodes.insert(layer_nodes.begin(), params.inputs);
	layer_nodes.push_back(params.outputs);

	nodes = new float*[ layer_nodes.size() ];
	weights = new float*[ layer_nodes.size()-1 ];
	for(uint32 i=0; i<layer_nodes.size(); i++) {
		nodes[i] = new float[ layer_nodes[i] ];
		if(i > 0)
			weights[i-1] = new float[ layer_nodes[i-1] * layer_nodes[i] ];//previous * current layer nodes size
	}

	randomizeWeights();
}

NetworkIndividual::NetworkIndividual(const NetworkIndividual& individual) {
	*this = individual;
}

NetworkIndividual::~NetworkIndividual() {
	for(uint32 i=0; i<layer_nodes.size(); i++) {
		delete nodes[i];
		if(i > 0)
			delete[] weights[i-1];
	}
	delete[] nodes;
	delete[] weights;
}

NetworkIndividual& NetworkIndividual::operator=(const NetworkIndividual& individual) {
	((Individual&)(*this)) = individual;

	//copy stuff here
	this->params = individual.params;
	this->copyWeights( individual.weights );
	this->copyNodeValues( individual.nodes );

	return *this;
}

NetworkIndividual* NetworkIndividual::clone_ptr() const {//NOTE this returns pointer that must be deleted
	NetworkIndividual* clone = new NetworkIndividual(this->params);
	clone->copyWeights(this->weights);
	clone->copyNodeValues(this->nodes);
	Individual::copyToClone(clone);

	return clone;
}

void NetworkIndividual::randomizeWeights() {
	for(uint32 i=1; i<layer_nodes.size(); i++) {
		uint32 weights_size = layer_nodes[i-1] * layer_nodes[i];
		for(uint32 j=0; j<weights_size; j++)
			weights[i-1][j] = Utils::randFloat()*2.f - 1.f;
	}
}

void NetworkIndividual::copyWeights(float** source_weights) {
	for(uint32 i=1; i<layer_nodes.size(); i++) {
		uint32 weights_size = layer_nodes[i-1] * layer_nodes[i];
		for(uint32 j=0; j<weights_size; j++)//TODO: speed it up a bit with memcpy
			weights[i-1][j] = source_weights[i-1][j];
	}
}

void NetworkIndividual::copyNodeValues(float** source_nodes) {
	for(uint32 i=0; i<layer_nodes.size(); i++) {
		for(uint32 j=0; j<layer_nodes[i]; j++)//TODO: speed it up a bit with memcpy
			nodes[i][j] = source_nodes[i][j];
	}
}

uint32 NetworkIndividual::calculateOutput(/*float* input*/uint32 input_address) {
	float* input = (float*)input_address;
	for(uint32 i=0; i<params.inputs; i++)
		nodes[0][i] = input[i];

	const uint32 last_i = layer_nodes.size() - 1;

	//forward propagation
	for(uint32 i=1; i<layer_nodes.size(); i++) {//for each layer after input layer
		for(uint32 j=0; j<layer_nodes[i]; j++) {
			nodes[i][j] = 0.f;//clear previous state

			for(uint32 k=0; k<layer_nodes[i-1]; k++) {//for each previous layer node
				uint32 w_index = j + k*layer_nodes[i];
				//add previous layer node value multiply by corresponding weight
				nodes[i][j] += nodes[i-1][k] * weights[i-1][w_index];
			}

			//apply activation function
			nodes[i][j] = activate( nodes[i][j], this->params.activation_func );
		}
	}

	return (uint32)&nodes[last_i][0];
	//return nodes[ last_i ];//output layer values
}

uint32 NetworkIndividual::getMemoryUsed() const {//KiB
	uint32 values = 0;

	for(uint32 i=0; i<layer_nodes.size(); i++) {
		values += layer_nodes[i];//nodes in layer
		if(i > 0)
			values += layer_nodes[i-1] * layer_nodes[i];//weights between layers
	}
	return static_cast<uint32>( sizeof(float) ) * values / 1024;
}
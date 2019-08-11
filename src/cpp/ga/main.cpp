#include "buffer_evolution.h"
#include "network_evolution.h"

#ifndef __EMSCRIPTEN__
	//run tests
	int main() {
		BufferEvolution evolution = BufferEvolution();

		evolution.initPopulation(50, 100);
		evolution.evolve();

		printf("Tests finished\n");
		return 0;
	}
#else
	//emscripten bindings

	#include "emscripten/bind.h"
	using namespace emscripten;

	EMSCRIPTEN_BINDINGS (c) {
		class_<Individual>("Individual")
			.constructor<>()
	        .function("setScore", &Individual::setScore);

		class_<BufferIndividual, emscripten::base<Individual>>("BufferIndividual")
			.constructor<uint32>()
			.function("getBufferAddress", &BufferIndividual::getBufferAddress)
	        .function("getMemoryUsed", &BufferIndividual::getMemoryUsed);//pure_virtual()

		class_<GA>("GA")
	        .function("evolve", &GA::evolve)
	        .function("getGeneration", &GA::getGeneration)
	        .function("getBestScore", &GA::getBestScore);

		class_<BufferEvolution, emscripten::base<GA>>("BufferEvolution")
			.constructor<>()
			.constructor<float>()
			.constructor<float, float>()
			.constructor<float, float, uint32>()
			.constructor<float, float, uint32, float>()
	        .constructor<float, float, uint32, float, uint32>()
	        .function("initPopulation", &BufferEvolution::initPopulation)
	        .function("getIndividual", &BufferEvolution::getIndividual, allow_raw_pointers());

	    class_<NetworkEvolution, emscripten::base<GA>>("NetworkEvolution")
			.constructor<>()
			.constructor<float>()
			.constructor<float, float>()
			.constructor<float, float, uint32>()
			.constructor<float, float, uint32, float>()
	        .constructor<float, float, uint32, float, uint32>()
	        .function("initPopulation", &NetworkEvolution::initPopulation)
	        .function("getIndividual", &NetworkEvolution::getIndividual, allow_raw_pointers());

	   	//register_vector<char>("vector<char>");
	}

#endif
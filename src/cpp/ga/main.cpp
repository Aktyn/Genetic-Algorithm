#include "buffer_evolution.h"
#include "network_evolution.h"
#include <cstdio>
#include <cstring>

#ifndef __EMSCRIPTEN__
	//run tests
	int main() {
		const char* target_sentence = "EVERYBODY DANCE NOW";
		const uint32 length = strlen(target_sentence);
		const uint32 population = 256;

		BufferEvolution evolution = BufferEvolution(0.1f, 0.9f, 4, 0.5f, 2.0f, 3);

		evolution.initPopulation(population, length);

		for(uint32 iteration=0; iteration<200; iteration++) {
			uint32 best_score = 0;
			BufferIndividual* best_individual = nullptr;
			for(uint32 j=0; j<population; j++) {
				BufferIndividual* individual = evolution.getIndividual(j);
				float* buffer = individual->getBuffer();
				uint32 score = 0;
				for(uint32 k=0; k<length; k++) {
					//if(target_sentence[k] == 'E' && buffer[0] > 0.f)
					//	score++;
					if( target_sentence[k] == (char)(buffer[k]*128) )
						score++;
				}
				individual->setScore(score);

				if(score > best_score) {
					best_score = score;
					best_individual = individual;
				}
			}

			if(best_individual) {
				for(uint32 k=0; k<length; k++) {
					char letter = (char)(best_individual->getBuffer()[k]*128);
					if((letter >= 'a' && letter <= 'z') || (letter >= 'A' && letter <= 'Z') || letter == ' ')
						printf("%c", letter );
				}
				printf("\t species: ");
				evolution.printSpeciesSizes();
			}

			evolution.evolve(16, 0.8);
		}

		printf("Tests finished\n");
		return 0;
	}
#else//emscripten bindings

	std::vector<uint32> createVector() {
		return std::vector<uint32>();
	}

	#include "emscripten/bind.h"
	using namespace emscripten;

	EMSCRIPTEN_BINDINGS (c) {
		register_vector<uint32>("vector<uint32>");
		function("createVector", &createVector);

		enum_<activation::FUNCTION>("ACTIVATION")
			.value("SIGMOID", activation::SIGMOID)
            .value("TANH", activation::TANH);

		class_<Individual>("Individual")
			.constructor<>()
	        .function("setScore", &Individual::setScore);

		class_<BufferIndividual, emscripten::base<Individual>>("BufferIndividual")
			.constructor<uint32>()
			.function("getBufferAddress", &BufferIndividual::getBufferAddress)
	        .function("getMemoryUsed", &BufferIndividual::getMemoryUsed);

	    class_<NetworkIndividual, emscripten::base<Individual>>("NetworkIndividual")
			.constructor<>()
			.function("calculateOutput", &NetworkIndividual::calculateOutput/*, allow_raw_pointers()*/)
	        .function("getMemoryUsed", &NetworkIndividual::getMemoryUsed);

		class_<HeapPopulation>("HeapPopulation")
	        .function("getNumberOfSpecies", &HeapPopulation::getNumberOfSpecies);

		class_<GA, emscripten::base<HeapPopulation>>("GA")
	        .function("evolve", &GA::evolve)
	        .function("getGeneration", &GA::getGeneration)
	        .function("getBestScore", &GA::getBestScore);

		class_<BufferEvolution, emscripten::base<GA>>("BufferEvolution")
			.constructor<>()
			.constructor<float>()
			.constructor<float, float>()
			.constructor<float, float, uint32>()
			.constructor<float, float, uint32, float>()
	        .constructor<float, float, uint32, float, float>()
	        .constructor<float, float, uint32, float, float, uint32>()
	        .function("initPopulation", &BufferEvolution::initPopulation)
	        .function("getIndividual", &BufferEvolution::getIndividual, allow_raw_pointers());

	    class_<NetworkEvolution, emscripten::base<GA>>("NetworkEvolution")
			.constructor<>()
			.constructor<float>()
			.constructor<float, float>()
			.constructor<float, float, uint32>()
			.constructor<float, float, uint32, float>()
	        .constructor<float, float, uint32, float, float>()
	        .constructor<float, float, uint32, float, float, uint32>()
	        .function("initPopulation", &NetworkEvolution::initPopulation)
	        .function("getIndividual", &NetworkEvolution::getIndividual, allow_raw_pointers());
	}

#endif
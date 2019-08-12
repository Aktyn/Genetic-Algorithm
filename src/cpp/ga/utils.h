#ifndef GA_UTILS_H
#define GA_UTILS_H

//#include <vector>
#include <stdio.h>
#include <stdlib.h>//srand, rand
#include <time.h>
#include <algorithm>

#include "types.h"

#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

namespace Utils {

	inline void initRandom() {
		srand( time(0) );
	}

	inline float randFloat() {//return float value between 0 and 1
		return rand() / static_cast<float>( RAND_MAX );
	}

	inline uint32 randomInt32(uint32 _min, uint32 _max) {
		return _min + (static_cast<uint32>(rand()) % (_max-_min+1));
	}

	inline uint16 randomInt16(uint16 _min, uint16 _max) {
		return _min + (static_cast<uint16>(rand()) % (_max-_min+1));
	}

	inline float clampFloat(float val, float min, float max) {
		if(val > max)
			return max;
		if(val < min)
			return min;
		return val;
	}

	//NOTE: each buffer must have same size
	static void crossoverBuffers(
		float* target, const float* parent1, const float* parent2, uint32 buffer_size, uint32 splits
	) {
		uint32 j;

		uint32 split_points[splits];
		for(uint32 i=0; i<splits; i++)
			split_points[i] = randomInt32(1, buffer_size-1);
			//1 + ( rand() % (buffer_size-1) );//0 excluded

		std::sort( &split_points[0], &split_points[splits] );

		const float* parents_dna[2] = {parent1, parent2};
		uint32 start = 0, shift = 0;
		for(j=0; j<splits; j++) {
			if(split_points[j] == start && start != 0) {
				shift++;
				continue;
			}
			for(uint32 i=start; i<split_points[j]; i++)
				target[i] = parents_dna[ (j+shift)%2 ][i];
			start = split_points[j];
		}

		for(uint32 i=start; i<buffer_size; i++)
			target[i] = parents_dna[ (j+shift)%2 ][i];

		//deterministic algorithm
		/*const float* parents_dna[2] = {parent1, parent2};
		const uint32 chunk_size = MAX(1, buffer_size / splits);
		for(uint32 i=0; i<buffer_size; i++) {
			uint32 chunk_i = i / chunk_size;
			target[i] = parents_dna[chunk_i%2][i];
		}*/
	}

	static void mutateBuffer(float* buff, uint32 buffer_size, float mutation_chance, float mutation_scale,
		bool clamp = true)
	{
		for(uint32 i=0; i<buffer_size; i++) {
			if( Utils::randFloat() < mutation_chance ) {
				buff[i] += Utils::randFloat() * (Utils::randFloat()*2.f - 1.f) * mutation_scale;
				if( clamp )
					buff[i] = clampFloat(buff[i], 0.f, 1.f);
			}
		}
	}
}

#endif
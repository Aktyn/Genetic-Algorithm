#ifndef GA_TYPES_H
#define GA_TYPES_H

#include <cstdint>

#ifndef nullptr
	#define nullptr 0
#endif

typedef uint8_t uint8;
typedef uint16_t uint16;
typedef uint32_t uint32;
//typedef uint64_t uint64; //cannot be used with 32-bit wasm

#endif
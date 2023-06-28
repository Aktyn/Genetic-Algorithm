const WasmModule: Promise<ModuleInstance> = require("../wasm_out/ga.js")();

declare type ENUM = any;

interface ModuleInstance {
  addOnPostRun(callback: () => void): void;
  BufferEvolution: BufferEvolution;
  NetworkEvolution: NetworkEvolution;
  TspEvolution: TspEvolution;

  createVector(): Uint32Vector;

  ACTIVATION: {
    SIGMOID: ENUM;
    TANH: ENUM;
  };

  HEAPF32: Float32Array;
  HEAPU32: Uint32Array;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
}

interface Uint32Vector {
  push_back(value: number): void;
  get(index: number): number;
  delete(): void;
}

interface IndividualBase {
  getMemoryUsed(): number;
  setScore(score: number): void;
}

export interface NetworkIndividual extends IndividualBase {
  calculateOutput(input_ptr: number): number;
}

export interface BufferIndividual extends IndividualBase {
  getBufferAddress(): number;
}

export interface TspIndividual extends IndividualBase {
  getBufferAddress(): number;
}

interface EvolutionBase<ChildClass, IndividualClass> {
  new (
    mutation_chance: number,
    mutation_scale: number,
    dna_splits: number,
    dna_twist_chance: number,
    parent_fitness_scale: number,
    elitism: number
  ): ChildClass;
  evolve(
    tournament_size: number,
    selection_probability: number,
    max_species: number,
    split_species_probability: number,
    merge_species_probability: number
  ): void;
  getIndividual(index: number): IndividualClass;
  getGeneration(): number;
  getBestScore(): number;
  getNumberOfSpecies(): number;
  delete(): void;
}

export interface NetworkEvolution
  extends EvolutionBase<NetworkEvolution, NetworkIndividual> {
  initPopulation(
    population: number,
    inputs: number,
    hidden_layers: Uint32Vector | number[],
    outputs: number,
    activation_func: ENUM
  ): void;
}

export interface BufferEvolution
  extends EvolutionBase<BufferEvolution, BufferIndividual> {
  initPopulation(population: number, buffer_size: number): void;
}

export interface TspEvolution
  extends EvolutionBase<TspEvolution, TspIndividual> {
  initPopulation(population: number, buffer_size: number): void;
}

let module_loaded = false;
let load_listeners: (() => void)[] = [];

export const HEAPs: {
  HEAPF32: Float32Array;
  HEAPU32: Uint32Array;
  malloc: (bytes: number) => number;
  free: (ptr: number) => void;
} = {
  HEAPF32: new Float32Array(0),
  HEAPU32: new Uint32Array(0),
  malloc: () => 0,
  free: () => void 0,
};

WasmModule.then((wasm) => {
  console.log("WASM module loaded");
  HEAPs.HEAPF32 = wasm.HEAPF32;
  HEAPs.HEAPU32 = wasm.HEAPU32;
  HEAPs.malloc = wasm._malloc;
  HEAPs.free = wasm._free;

  module_loaded = true;
  load_listeners.forEach((listener) => listener());
  load_listeners = [];
}).catch(console.error);

export function getWasmModule() {
  return WasmModule;
}

export function onModuleLoad(): Promise<void> {
  if (module_loaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    load_listeners.push(resolve);

    setTimeout(() => {
      if (!module_loaded) reject("Timeout");
    }, 5000);
  });
}

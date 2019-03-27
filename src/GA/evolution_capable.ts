export default interface EvolutionCapable {
	clone(): EvolutionCapable;
	memory_used: number;
}
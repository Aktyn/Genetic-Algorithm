import EvolutionCapable from './evolution_capable';

export interface BufferParams {
	length: number;
}

export default class Buffer1D implements EvolutionCapable {
	private tab: Float32Array;

	constructor(params: BufferParams) {
		this.tab = new Float32Array(params.length);
		for(let i=0; i<this.tab.length; i++)
			this.tab[i] = Math.random();
	}

	clone() {
		let copy = new Buffer1D({length: this.tab.length});
		copy.copyValues(this.tab);
		return copy;
	}

	public get memory_used() {
		return this.tab.length*4;//4 bytes for Float32Array
	}

	copyValues(source: Float32Array) {
		for(let i=0; i<source.length; i++)
			this.tab[i] = source[i];
	}

	clamp(min: number, max: number) {
		for(let i=0; i<this.tab.length; i++)
			this.tab[i] = Math.max(min, Math.min(max, this.tab[i]));
	}

	getValues() {
		return this.tab;
	}
}
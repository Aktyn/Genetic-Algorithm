export const ActivationFunctions = {
	sigmoid: (x: number) => {
		return 1.0 / (1.0 + Math.exp(-x));//1 / (1 + e^(-x))
	},
	tanh: (x: number) => {
		//(e^x – e^(-x)) / (e^x + e^(-x))
		let ex = Math.exp(x);
		let erev = Math.exp(-x);
		return (ex - erev) / (ex + erev);
	}
};

export default class Network {
	private weights: Float32Array[];
	private nodes: Float32Array[];

	constructor(inputs: number, hidden_layers: number[], outputs: number) {
		this.nodes = [];
		this.weights = [];

		for(let h_nodes of [inputs, ...hidden_layers, outputs])
			this.addLayer(h_nodes);

		this.randomizeWeights();
	}

	private get input_nodes() {
		return this.nodes[0];
	}

	private get output_nodes() {
		return this.nodes[this.nodes.length-1];
	}

	public clone() {
		let hidden: number[] = [];
		for(let i=1; i<this.nodes.length-1; i++)
			hidden.push(this.nodes[i].length);

		let copy = new Network(this.input_nodes.length, hidden, this.output_nodes.length);
		copy.copyWeights(this.weights);
		return copy;
	}

	private addLayer(nodes_count: number) {
		let current_layers = this.nodes.push( new Float32Array(nodes_count) );
		if(current_layers >= 2) {
			this.weights.push(new Float32Array(
				this.nodes[current_layers-1].length * this.nodes[current_layers-2].length
			));
		}
	}

	public getWeights() {
		return this.weights;
	}

	public randomizeWeights() {
		for(let w of this.weights) {
			for(let i=0; i<w.length; i++)
				w[i] = Math.random()*2 - 1;
		}
	}

	public copyWeights(source_w: Float32Array[]) {
		for(let w in this.weights) {
			for(let i=0; i<this.weights[w].length; i++)
				this.weights[w][i] = source_w[w][i];
		}
	}

	public calculateOutput(input: Float32Array | number[], activation: (x: number) => number) {
		for(let i=0; i<input.length && i<this.input_nodes.length; i++)
			this.input_nodes[i] = input[i];

		//forward propagation
		for(let i=1; i<this.nodes.length; i++) {
			for(let j=0; j<this.nodes[i].length; j++) {
				this.nodes[i][j] = 0;//current layer node

				for(let k=0; k<this.nodes[i-1].length; k++) {//prev nodes
					let w_index = j + k*this.nodes[i].length;
					//add previous layer node value multiply by corresponding weight
					this.nodes[i][j] += this.nodes[i-1][k] * this.weights[i-1][w_index];
				}

				//apply activation function
				this.nodes[i][j] = activation(this.nodes[i][j]);
				//ActivationFunctions.tanh(this.nodes[i][j]);
			}
		}

		return this.output_nodes;
	}
}
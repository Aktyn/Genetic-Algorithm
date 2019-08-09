import React from 'react';
import {Link} from 'react-router-dom';

export default class extends React.Component<any, any> {

	constructor(props: any) {
		super(props);
	}

	render() {
		return <div style={{display: 'grid', gridTemplateColumns: 'auto'}}>
			<Link to='/dino'>Dino game</Link>
			<Link to='/reconstruction'>Image reconstruction</Link>
		</div>;
	}
}
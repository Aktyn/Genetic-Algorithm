import * as React from 'react';
import { render } from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './styles/main.scss';

import Menu from './menu';

class Loader extends React.Component<Loadable.LoadingComponentProps, any> {
	static defaultProps = {
		isLoading: true,
	};

	render() {
		return <div>Loading...</div>;
	}
}

function __async(_loader: () => any) {
	return Loadable({
		loader: _loader,
		loading: Loader
	});
}

const Dinosaur = __async(
	() => import(/* webpackChunkName: "dinosaur", webpackPrefetch: true */ './dinosaur'));
const Reconstruction = __async(
	() => import(/* webpackChunkName: "reconstruction", webpackPrefetch: true */ './reconstruction'));
const TspView = __async(
	() => import(/* webpackChunkName: "tsp", webpackPrefetch: true */ './tsp'));

render(
    <BrowserRouter>
		<Switch>
			<Route path="/dino" exact component={Dinosaur} />
			<Route path="/reconstruction" exact component={Reconstruction} />
			<Route path="/tsp" exact component={TspView} />
    		<Route path="*" exact component={Menu} />
		</Switch>
  	</BrowserRouter>,
    document.getElementById('page'),
);
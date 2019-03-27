import * as React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './styles/main.scss';

import Menu from './menu';
import Dinosaur from './dinosaur';
import Reconstructor from './reconstructor';

render(
    <BrowserRouter>
		<Switch>
			<Route path="/dino" exact component={Dinosaur} />
			<Route path="/reconstructor" exact component={Reconstructor} />
    		<Route path="*" exact component={Menu} />
		</Switch>
  	</BrowserRouter>,
    document.getElementById('page'),
);
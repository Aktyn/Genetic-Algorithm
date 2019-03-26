import * as React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './styles/main.scss';

import Dinosaur from './dinosaur/index';

render(
    <BrowserRouter>
		<Switch>
    		<Route path="*" exact component={Dinosaur} />
		</Switch>
  	</BrowserRouter>,
    document.getElementById('page'),
);
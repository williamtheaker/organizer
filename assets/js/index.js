import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import 'react-select/dist/react-select.css'
import 'rc-switch/assets/index.css'
import { users } from './UserManager'

import { AppContainer } from 'react-hot-loader'
import App from './components/App'

import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();
users.sideloadOrFetch();

const render = (Component) => {
  ReactDOM.render(
    <AppContainer><Component/></AppContainer>,
    document.getElementById('container')
  );
}

render(App);

if (module.hot) {
  module.hot.accept('./components/App', () => {
    render(App)
  });
}

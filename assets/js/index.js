import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'

import { AppContainer } from 'react-hot-loader'
import App from './components/App'

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

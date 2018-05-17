import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import 'react-select/dist/react-select.css'
import 'rc-switch/assets/index.css'
import { Provider } from 'react-redux'
import { compose, createStore, applyMiddleware } from 'redux'

import { AppContainer } from 'react-hot-loader'
import App from './components/App'
import organizerApp from './reducers'
import thunkMiddleware from 'redux-thunk'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'

import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

const composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  organizerApp,
  composer(applyMiddleware(thunkMiddleware))
);
const persistor = persistStore(store);

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}><Component/></PersistGate>
      </Provider>
    </AppContainer>,
    document.getElementById('container')
  );
}

render(App);

if (module.hot) {
  module.hot.accept('./components/App', () => {
    render(App)
  });
}

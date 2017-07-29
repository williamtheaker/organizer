import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Footer from './Footer'
import FormView from './FormView'
import { asyncComponent } from 'react-async-component'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';

const LazyOrganizerIndex = asyncComponent({
  resolve: () => import('./OrganizerIndex').then(m => m.default)
});

const LazyAppIndex = asyncComponent({
  resolve: () => import('./AppIndex').then(m => m.default)
});

const App = (props) => (
  <ThemeProvider>
    <Router>
      <div>
        <Route path="/action/:id" component={FormView}/>
        <Route path="/organize" component={LazyOrganizerIndex} />
        <Route exact path="/" component={LazyAppIndex} />
        <Footer />
      </div>
    </Router>
  </ThemeProvider>
)

export default App

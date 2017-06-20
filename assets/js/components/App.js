import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { titles } from '../TitleManager'

import Footer from './Footer'
import Header from './Header'
import FormView from './FormView'
import { asyncComponent } from 'react-async-component'

const LazyOrganizerIndex = asyncComponent({
  resolve: () => import('./OrganizerIndex').then(m => m.default)
});

const LazyAppIndex = asyncComponent({
  resolve: () => import('./AppIndex').then(m => m.default)
});

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      subtitle: '',
      title: ''
    }
    titles.register(() => {
      this.setState({title: titles.title, subtitle: titles.subtitle});
    });
  }

  render() {
    return (
      <Router>
        <div>
          <Header title={this.state.title} subtitle={this.state.subtitle} />
          <Route exact path="/crm/f/:id" component={FormView}/>
          <Route path="/action/:action/:id" component={FormView}/>
          <Route path="/organize" component={LazyOrganizerIndex} />
          <Route exact path="/" component={LazyAppIndex} />
          <Footer />
        </div>
      </Router>
    )
  }
}

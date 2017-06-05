import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { titles } from '../TitleManager'

import Footer from './Footer'
import Canvas from './Canvas'
import Header from './Header'
import FormView from './FormView'
import { asyncComponent } from 'react-async-component'

const LazyOrganizerIndex = asyncComponent({
  resolve: () => import('./OrganizerIndex').then(m => m.default)
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
          <div className="row">
            <div className="small-12 columns">
              <Header title={this.state.title} subtitle={this.state.subtitle} />
              <Canvas>
                <Route exact path="/crm/f/:id" component={FormView}/>
                <Route path="/organize" component={LazyOrganizerIndex} />
              </Canvas>
            </div>
          </div>
          <Footer />
        </div>
      </Router>
    )
  }
}


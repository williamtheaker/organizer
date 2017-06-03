import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { titles } from './TitleManager'

import Footer from './components/Footer'
import Canvas from './components/Canvas'
import Header from './components/Header'
import FormView from './components/FormView'
import Lazy from './components/Lazy'

const LazyOrganizerIndex = Lazy(import('./components/OrganizerIndex'))

class App extends React.PureComponent {
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

ReactDOM.render(<App/>, document.getElementById('container'))

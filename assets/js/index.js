import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { titles } from './TitleManager'

import Footer from './components/Footer'
import Canvas from './components/Canvas'
import Header from './components/Header'
import FormView from './components/FormView'
import ActionReport from './components/ActionReport'
import ActivistReport from './components/ActivistReport'

class App extends React.Component {
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
                <Route exact path="/crm/action/:id" component={ActionReport}/>
                <Route exact path="/crm/activist/" component={ActivistReport}/>
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

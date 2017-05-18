import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'

class Footer extends React.Component {
  render() {
    return (
      <footer>
        <div className="row">
          <div className="small-12 columns">
            Made with love in Oakland, CA
          </div>
        </div>
      </footer>
    )
  }
}

class Canvas extends React.Component {
  render() {
    return (
      <div className="row canvas">
        <div className="small-12 columns">
          {this.props.children}
        </div>
      </div>
    )
  }
}

class Header extends React.Component {
    render() {
      return (
        <header className="row">
          <div className="small-10 columns mastiff">
            <h1>{this.props.title}</h1>
            <h2>{this.props.subtitle}</h2>
          </div>
          <div className="small-2 columns logo">
            <a href="/">East Bay Forward</a>
          </div>
        </header>
      )
    }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <div className="row">
          <div className="small-12 columns">
            <Header />
            <Canvas />
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('container'))

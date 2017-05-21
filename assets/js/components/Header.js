import React from 'react'
import { Link } from 'react-router-dom'

export default class Header extends React.Component {
  render() {
    return (
      <header className="row">
        <div className="small-10 columns mastiff">
          <h1>{this.props.title}</h1>
          <h2>{this.props.subtitle}</h2>
        </div>
        <div className="small-2 columns logo">
          <Link to="/">East Bay Forward</Link>
        </div>
      </header>
    )
  }
}

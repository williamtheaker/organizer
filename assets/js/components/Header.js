import React from 'react'
import { Link } from 'react-router-dom'

export default (props) => (
  <header className="row">
    <div className="small-10 columns mastiff">
      <h1>{props.title}</h1>
      <h2>{props.subtitle}</h2>
    </div>
    <div className="small-2 columns logo">
      <Link to="/">East Bay Forward</Link>
    </div>
  </header>
)

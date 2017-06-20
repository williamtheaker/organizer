import React from 'react'
import { Link } from 'react-router-dom'

export default (props) => {
  if (props.title || props.subtitle) {
    if (!props.subtitle) {
      return (
        <header className="row">
        <div className="small-10 columns mastiff">
          <h1>{props.title}</h1>
        </div>
        <div className="small-2 columns logo">
          <Link to="/">East Bay Forward</Link>
        </div>
      </header>
      )
    } else {
      return (
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
    }
  } else {
    return (
      <header className="row expanded">
        <div className="small-12 columns logo logo-full">
          <Link to="/">East Bay Forward</Link>
        </div>
      </header>
    )
  }
}

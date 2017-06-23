import React from 'react'
import { Link } from 'react-router-dom'
import { Paper } from 'material-ui'

export default (props) => {
  if (props.title) {
    return (
      <header className="row">
      <Paper className="small-10 columns mastiff">
        <h1>{props.title}</h1>
      </Paper>
      <div className="small-2 columns logo">
        <Link to="/">East Bay Forward</Link>
      </div>
    </header>
    )
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

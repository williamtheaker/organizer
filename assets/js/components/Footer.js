import React from 'react'
import FontAwesomeIcon from 'react-fontawesome'

export default (props) => (
  <footer>
    <div className="row">
      <div className="small-6 columns">
        <p>Made with ❤ in Oakland, CA</p>
      </div>
      <div className="small-6 columns" style={{textAlign: 'right'}}>
        <p><a href={props.slackUrl}><FontAwesomeIcon name='lock' /> Login</a></p>
      </div>
    </div>
  </footer>
)

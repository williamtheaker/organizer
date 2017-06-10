import React from 'react'

export default (props) => (
  <footer>
    <div className="row">
      <div className="small-6 columns">
        <p>Made with ❤ in Oakland, CA</p>
      </div>
      <div className="small-6 columns" style={{textAlign: 'right'}}>
        <p><a href={SLACK_LOGIN_URL}><i className="fa fa-lock"/> Login</a></p>
      </div>
    </div>
  </footer>
)

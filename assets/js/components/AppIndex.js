import React from 'react'
import { Divider, Paper } from 'material-ui'

export default (props) => (
  <Paper zDepth={1} className="app-splash">
    <h1>East Bay Forward <div className="pop">Organizer</div></h1>
    <p>The housing shortage is not an unintended policy failure. The Bay Area
      has a housing shortage because of decades of voting and organizing against
      housing. The solution is to organize for housing.</p>
    <p>East Bay Forward Organizer helps people organize for housing.</p>
    <Divider />
    <p />
    <p><a href={SLACK_LOGIN_URL}>
      <img
        alt="Sign in with Slack"
        height="40"
        width="172"
        src="https://platform.slack-edge.com/img/sign_in_with_slack.png"
        srcSet="https://platform.slack-edge.com/img/sign_in_with_slack.png 1x, https://platform.slack-edge.com/img/sign_in_with_slack@2x.png 2x"
      />
    </a></p>
    <p>Please sign in with East Bay Forward Slack to continue.</p>
    <p className="github-link"><a href="https://github.com/tdfischer/organizer/"><i className="fa fa-github"/></a></p>
  </Paper>
)

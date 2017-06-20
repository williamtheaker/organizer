import React from 'react'
import { titles } from './../TitleManager'
import { Route, Link, Switch } from 'react-router-dom'
import MenuNavLink from './MenuNavLink'

import { Activist } from '../API'

import ActionReport from './ActionReport'
import FormEditor from './FormEditor'
import ActionIndex from './ActionIndex'

import { users, withCurrentUser } from '../UserManager'
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'

class OrganizerIndexBase extends React.Component {
  componentDidMount() {
    if (this.props.logged_in) {
      titles.setTitle("EBF Organizer", "");
    } else {
      titles.setTitle("EBF Organizer", "Login");
    }
  }

  doLogout() {
    users.logout();
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.logged_in) {
      titles.setTitle("EBF Organizer", "Login");
    }
  }

  render() {
    if (this.props.logged_in) {
      return (
        <div className="row organizer-index">
          <div className="small-12 columns">
            <ul className="menu">
              <MenuNavLink to={`${this.props.match.url}`} exact><i className="fa fa-home"></i></MenuNavLink>
              <li className="menu-text">
                Hi, {this.props.current_user.email}!
              </li>
              <li><a onClick={this.doLogout}>Log Out</a></li>
            </ul>
            <Switch>
              <Route exact path={`${this.props.match.url}/action`} component={ActionIndex}/>
              <Route path={`${this.props.match.url}/action/:action_id/form/:id`} component={FormEditor}/>
              <Route path={`${this.props.match.url}/action/:id`} component={ActionReport}/>
              <Route component={ActionIndex}/>
            </Switch>
          </div>
        </div>
      );
    } else {
      return (
        <div className="row organizer-index">
          <div className="small-12 columns signin">
            <h1>East Bay Forward Organizer</h1>
            <a href={SLACK_LOGIN_URL}>
              <img
                alt="Sign in with Slack"
                height="40"
                width="172"
                src="https://platform.slack-edge.com/img/sign_in_with_slack.png"
                srcSet="https://platform.slack-edge.com/img/sign_in_with_slack.png 1x, https://platform.slack-edge.com/img/sign_in_with_slack@2x.png 2x"
              />
            </a>
            <p>Please sign in with East Bay Forward Slack to continue</p>
          </div>
        </div>
      )
    }
  }
}

const OrganizerIndex = DragDropContext(HTML5Backend)(withCurrentUser(OrganizerIndexBase));
export default OrganizerIndex;

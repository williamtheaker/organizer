import React from 'react'
import { ModelDataStore } from './RowDataStore'
import StoreBinding from './StoreBinding'
import { titles } from './../TitleManager'
import { Table } from './DataTable'
import { Route, Link, Switch } from 'react-router-dom'
import MenuNavLink from './MenuNavLink'

import { Activist } from '../API'

import ActionReport from './ActionReport'
import FormEditor from './FormEditor'
import ActionIndex from './ActionIndex'
import ActivistIndex from './ActivistIndex'

import { users, withCurrentUser } from '../UserManager'

class OrganizerDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.store = new ModelDataStore(Activist, {sort: '-created'})
    this.store.reload();
  }

  componentDidMount() {
    titles.setSubtitle("Dashboard");
  }

  render() {
    return (
      <div className="row">
        <div className="small-12 columns">
          <div className="row">
            <div className="small-12 columns">
              <h1>Organizer Dashboard</h1>
            </div>
          </div>
          <div className="row">
            <div className="small-6 columns">
              <h2>New Activists</h2>
              <StoreBinding store={this.store}>
                <Table />
              </StoreBinding>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

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
        <div className="row">
          <div className="small-12 columns">
            <ul className="menu">
              <MenuNavLink to={`${this.props.match.url}`} exact><i className="fa fa-home"></i></MenuNavLink>
              <MenuNavLink to={`${this.props.match.url}/activist`}>Activists</MenuNavLink>
              <MenuNavLink to={`${this.props.match.url}/action`}>Actions</MenuNavLink>
              <li className="menu-text">
                Hi, {this.props.current_user.email}!
              </li>
              <li><a onClick={this.doLogout}>Log Out</a></li>
            </ul>
            <Switch>
              <Route exact path={`${this.props.match.url}/action`} component={ActionIndex}/>
              <Route path={`${this.props.match.url}/action/:action_id/form/:id`} component={FormEditor}/>
              <Route path={`${this.props.match.url}/action/:id`} component={ActionReport}/>
              <Route exact path={`${this.props.match.url}/activist`} component={ActivistIndex}/>
              <Route component={OrganizerDashboard}/>
            </Switch>
          </div>
        </div>
      );
    } else {
      return (
        <div className="row">
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

const OrganizerIndex = withCurrentUser(OrganizerIndexBase);
export default OrganizerIndex;

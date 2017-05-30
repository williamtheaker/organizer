import React from 'react'
import { APIListDataStore } from './RowDataStore'
import StoreBinding from './StoreBinding'
import { titles } from './../TitleManager'
import { Table } from './DataTable'
import { Route, Link, Switch } from 'react-router-dom'
import MenuNavLink from './MenuNavLink'

import ActionReport from './ActionReport'
import FormEditor from './ActionReport'
import ActionIndex from './ActionIndex'
import ActivistIndex from './ActivistIndex'

class OrganizerDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.store = new APIListDataStore('/api/activists/recent/')
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

export default class OrganizerIndex extends React.Component {
  componentDidMount() {
    titles.setTitle("EBF Organizer", "");
  }

  render() {
    return (
      <div className="row">
        <div className="small-12 columns">
          <ul className="menu">
            <MenuNavLink to={`${this.props.match.url}`} exact><i className="fa fa-home"></i></MenuNavLink>
            <MenuNavLink to={`${this.props.match.url}/activist`}>Activists</MenuNavLink>
            <MenuNavLink to={`${this.props.match.url}/action`}>Actions</MenuNavLink>
          </ul>
          <Switch>
            <Route exact path={`${this.props.match.url}/action`} component={ActionIndex}/>
            <Route path={`${this.props.match.url}/form/:id`} component={FormEditor}/>
            <Route path={`${this.props.match.url}/action/:id`} component={ActionReport}/>
            <Route exact path={`${this.props.match.url}/activist`} component={ActivistIndex}/>
            <Route component={OrganizerDashboard}/>
          </Switch>
        </div>
      </div>
    );
  }
}



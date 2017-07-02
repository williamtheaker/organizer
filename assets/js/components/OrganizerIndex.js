import React from 'react'
import { Route, Link, Switch } from 'react-router-dom'

import ActionReport from './ActionReport'
import FormEditor from './FormEditor'
import ActionIndex from './ActionIndex'
import AppIndex from './AppIndex'

import { users, withCurrentUser } from '../UserManager'
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'

import { FlatButton, IconMenu, MenuItem, Avatar, AppBar, Paper } from 'material-ui'
//import gravatarUrl from 'gravatar-url'

const LoginMenu = withCurrentUser((props) =>  props.logged_in ? (
  <IconMenu
    iconButtonElement={<FlatButton><Avatar src={gravatarUrl(props.current_user.email)}/></FlatButton>} >
    <MenuItem onClick={() => users.logout()}>Logout</MenuItem>
  </IconMenu>
) : null)

const OrganizerAppBar = (props) => (
  <AppBar
    title={<Link to="/organize">Organizer</Link>}
    iconElementLeft={<LoginMenu />}
    className="organizer-app-bar"
  />
)

const OrganizerIndexBase = (props) => {
  if (props.logged_in) {
    return (
      <div>
        <OrganizerAppBar />
        <div className="row the-app">
          <div className="small-12 columns">
            <Switch>
              <Route exact path={`${props.match.url}/action`} component={ActionIndex}/>
              <Route path={`${props.match.url}/action/:action_id/form/:id`} component={FormEditor}/>
              <Route path={`${props.match.url}/action/:id`} component={ActionReport}/>
              <Route component={ActionIndex}/>
            </Switch>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <AppIndex />
    )
  }
}

const OrganizerIndex = withCurrentUser(OrganizerIndexBase);
export default OrganizerIndex;

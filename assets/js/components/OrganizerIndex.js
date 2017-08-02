import React from 'react'
import { Route, Link, Switch } from 'react-router-dom'

import ActionReport from './ActionReport'
import ActionIndex from './ActionIndex'
import AppIndex from './AppIndex'

import { users, withCurrentUser } from '../UserManager'
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'

import { CircularProgress, FlatButton, IconMenu, MenuItem, Avatar, AppBar, Paper } from 'material-ui'
import gravatarUrl from 'gravatar-url'
import { connect } from 'react-redux'

import ContentSave from 'material-ui/svg-icons/content/save';

const LoginMenu = withCurrentUser((props) =>  props.logged_in ? (
  <IconMenu
    iconButtonElement={<FlatButton><Avatar src={gravatarUrl(props.current_user.email)}/></FlatButton>} >
    <MenuItem onClick={() => users.logout()}>Logout</MenuItem>
  </IconMenu>
) : null)

function mapStateToProps(state) {
  return {
    saving: state.actions.saving,
    modified: state.actions.modified
  }
}

const LoadingIndicator = connect(mapStateToProps)(props => (
  props.modified ? 
    (props.saving ? (<CircularProgress color="#fff" />) : (<ContentSave style={{width: '36px', height: '36px'}}/>)) 
  : null
));

const OrganizerAppBar = (props) => (
  <AppBar
    title={<Link to="/organize">Organizer</Link>}
    iconElementLeft={<LoginMenu />}
    iconElementRight={<LoadingIndicator />}
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

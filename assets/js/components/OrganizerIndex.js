import React from 'react'
import { Route, Link, Switch } from 'react-router-dom'

import AppIndex from './AppIndex'
import importedComponent from 'react-imported-component'

import { CircularProgress, FlatButton, IconMenu, MenuItem, Avatar, AppBar } from 'material-ui'
import gravatar from 'gravatar'
import { connect } from 'react-redux'

import ContentSave from 'material-ui/svg-icons/content/save'

import { getCurrentUser, getLoggedIn, getModified, getSaving } from '../selectors'
import { logout } from '../actions'
import { bindActionCreators } from 'redux'

const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'))
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))

function mapLoginStateToProps(state) {
    return {
        logged_in: getLoggedIn(state),
        current_user: getCurrentUser(state)
    }
}

function mapLogoutDispatchToProps(dispatch) {
    return bindActionCreators({logout}, dispatch)
}

const LoginMenu = connect(mapLoginStateToProps, mapLogoutDispatchToProps)(props =>  props.logged_in ? (
    <IconMenu
        iconButtonElement={<FlatButton><Avatar src={gravatar.url(props.current_user.email, {s: 32, d: 'retro'})}/></FlatButton>} >
        <MenuItem onClick={() => props.logout()}>Logout</MenuItem>
    </IconMenu>
) : null)

function mapStateToProps(state) {
    return {
        saving: getSaving(state),
        modified: getModified(state)
    }
}

const LoadingIndicator = connect(mapStateToProps)(props => (
    props.modified ? 
        (props.saving ? (<CircularProgress color="#fff" />) : (<ContentSave style={{width: '36px', height: '36px'}}/>)) 
        : null
))

const OrganizerAppBar = (_props) => (
    <AppBar
        title={<Link to="/organize">Organizer</Link>}
        iconElementLeft={<LoginMenu />}
        iconElementRight={<LoadingIndicator />}
        className="organizer-app-bar"
    />
)

const OrganizerIndex = connect(mapLoginStateToProps)(props => {
    if (props.logged_in) {
        return (
            <div>
                <OrganizerAppBar />
                <div className="row the-app">
                    <div className="small-12 columns">
                        <Switch>
                            <Route exact path={`${props.match.url}/map`} component={MapIndex} />
                            <Route exact path={`${props.match.url}/people`} component={PeopleIndex} />
                            <Route component={OrganizerDashboard}/>
                        </Switch>
                    </div>
                </div>
                <div className="row the-nav">
                    <div className="small-12 columns">
                        Map etc
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <AppIndex />
        )
    }
})

export default OrganizerIndex

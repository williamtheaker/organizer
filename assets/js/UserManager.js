import EventEmitter from 'events'
import axios from 'axios'
import React from 'react'

export default class UserManager extends EventEmitter {
  constructor() {
    super();
    this.user = {};
    this.refresh();
  }

  logout() {
    return axios.get('/api/users/logout/')
      .then((response) => {
        this.user = {};
        this.emit('update', this.user);
      });
  }

  refresh() {
    if (typeof CURRENT_USER != "undefined" && CURRENT_USER.id) {
      this.user = CURRENT_USER;
      this.user._valid = true;
      this.emit('update', this.user);
    } else {
      return axios.get('/api/users/me/')
        .then((response) => {
          this.user = response.data;
          this.user._valid = true;
          this.emit('update', this.user);
        });
    }
  }

  loggedIn() {
    console.log("login check", this.user, this.user._valid === true);
    return this.user._valid === true;
  }
}

export var users = new UserManager();

export class UserBinding extends React.Component {
  constructor(props) {
    super(props);
    this.onUserUpdated = this.onUserUpdated.bind(this);
    this.state = {user: users.user};
  }

  onUserUpdated() {
    this.setState({user: users.user});
  }

  componentDidMount() {
    users.on('update', this.onUserUpdated);
  }

  componentWillUnmount() {
    users.removeListener('update', this.onUserUpdated);
  }

  render() {
    return (
      <span>
        {React.cloneElement(this.props.children, {
          current_user: this.state.user,
          logged_in: users.loggedIn()
        })}
      </span>
    )
  }
}

export function withCurrentUser(ChildComponent) {
  return (props) => (
    <UserBinding>
      <ChildComponent {...props} />
    </UserBinding>
  )
}

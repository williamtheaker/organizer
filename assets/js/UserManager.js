import EventEmitter from 'events'
import React from 'react'
import AmpersandState from 'ampersand-state'
import { bindToState, User } from './Model'

export const AuthState = AmpersandState.extend({
  derived: {
    logged_in: {
      deps: ['*'],
      fn() {
        return !this.user.isNew()
      },
      cache: false
    }
  },
  children: {
    user: User
  },
  logout() {
    return fetch('/api/users/logout/')
      .then(() => {
        this.user.clear()
      })
  },
  sideloadOrFetch() {
    const hasInline = (typeof CURRENT_USER != 'undefined');
    if (hasInline) {
      Raven.captureBreadcrumb({
        message: 'User loaded from sideload cache',
        category: 'action',
        data: CURRENT_USER,
      });
      this.user.set(CURRENT_USER)
    } else {
      return this.user.fetch({id: 'me'})
    }
  }
});

export var users = new AuthState()

export class UserBinding extends React.Component {
  constructor(props) {
    super(props);
    bindToState(this, users, {
      user: 'user',
      logged_in: 'logged_in'
    })
    this.state = {user: users.user, logged_in: users.logged_in};
  }

  render() {
    return (
      <span>
        {React.cloneElement(this.props.children, {
          current_user: this.state.user,
          logged_in: this.state.logged_in
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

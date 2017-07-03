import fetchMock from 'fetch-mock'
import React from 'react'
import { withCurrentUser, users, AuthState } from './UserManager'
import { mount } from 'enzyme'

describe('AuthState', () => {
  var auth;
  beforeEach(() => auth = new AuthState());

  afterEach(fetchMock.restore)

  global.Raven = {
    captureBreadcrumb: jest.fn()
  }

  it('defaults to logged out', () => {
    expect(auth.logged_in).toEqual(false)
  })

  it('is logged in with a non-new user', () => {
    auth.user.set({id: 1})
    expect(auth.logged_in).toEqual(true)
  })

  it('does not fetch when sideloaded', () => {
    global.CURRENT_USER = {id: 1}
    fetchMock.getOnce('/api/users/me', {})
    auth.sideloadOrFetch()
    expect(fetchMock.called()).toEqual(false)
    expect(auth.logged_in).toEqual(true)
  })

  it('logs out when asked', () => {
    global.CURRENT_USER = {id: 1}
    fetchMock.getOnce('/api/users/logout/', {})
    auth.sideloadOrFetch()
    expect(auth.logged_in).toEqual(true)

    auth.logout()
    return fetchMock.flush()
      .then(() => {
        expect(auth.logged_in).toEqual(false)
      })
  })
})

describe('withCurrentUser', () => {
  jest.useFakeTimers();

  it('sets user and logged_in when sideloaded', () => {
    global.CURRENT_USER = {id: 1}
    users.sideloadOrFetch()
    const renderSpy = jest.fn();
    class Component extends React.Component {
      render() {
        renderSpy(this.props);
        return <p />;
      }
    }
    const Wrapped = withCurrentUser(Component)
    const component = mount(<Wrapped />)
    jest.runAllTimers();

    expect(renderSpy).toHaveBeenLastCalledWith({
      current_user: users.user,
      logged_in: true
    })
  })
})

import { combineReducers } from 'redux'
import * as Actions from '../actions'
import _ from 'lodash'
import model from './model'

function currentAction(state = {}, action) {
  switch (action.type) {
    case Actions.SET_CURRENT_ACTION:
      return {
        ...state,
        id: action.id
      };
    default:
      return {
        id: 0,
        ...state
      }
  }
}

function auth(state = {}, action) {
  switch (action.type) {
    case Actions.RECEIVE_USER:
      return {
        ...state,
        loading: false,
        user: action.user
      };
    case Actions.REQUEST_USER:
      return {
        ...state,
        loading: true
      };
    default:
      const hasInline = (typeof CURRENT_USER != 'undefined');
      const defaultUser = hasInline ? CURRENT_USER : {};
      if (hasInline && !state.user) {
        Raven.captureBreadcrumb({
          message: 'User loaded from sideload cache',
          category: 'action',
          data: CURRENT_USER,
        });
      }
      return {
        loading: false,
        user: defaultUser,
        ...state
      }
  }
}

const organizerApp = combineReducers({currentAction, auth, model})

export default organizerApp

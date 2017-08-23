import { combineReducers } from 'redux'
import * as Actions from '../actions'
import _ from 'lodash'

function currentAction(state = 0, action) {
  switch (action.type) {
    case Actions.SET_CURRENT_ACTION:
      return action.id;
    default:
      return state
  }
}

function applyFor(matcher, func) {
  return o => {
    if (matcher(o)) {
      return func(o);
    }
    return o;
  }
}

function actions(state = {}, action) {
  switch (action.type) {
    case Actions.UPDATE_ACTION:
      const updater = a => _.merge({}, a, action.data);
      const idMatch = _.matchesProperty('id', action.id);
      return {
        ...state,
        actions: _.map(state.actions, applyFor(idMatch, updater))
      };
    case Actions.SAVING_ACTION:
      return {
        ...state,
        saving: true,
        modified: true
      };
    case Actions.SAVED_ACTION:
      return {
        ...state,
        saving: false,
        modified: true
      };
    case Actions.REQUEST_ACTIONS:
      return {
        ...state,
        loading: true
      };
    case Actions.RECEIVE_ACTIONS:
      return {
        ...state,
        loading: false,
        actions: _.unionBy(state.actions, action.actions, a => a.id)
      }
    default:
      return {
        loading: false,
        saving: false,
        modified: false,
        actions: [],
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
      if (hasInline) {
        Raven.captureBreadcrumb({
          message: 'User loaded from sideload cache',
          category: 'action',
          data: CURRENT_USER,
        });
      }
      return {
        ...state,
        loading: false,
        user: defaultUser
      }
  }
}

const organizerApp = combineReducers({actions, currentAction, auth})

export default organizerApp

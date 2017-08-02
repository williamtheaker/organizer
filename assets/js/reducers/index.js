import { combineReducers } from 'redux'
import {SAVING_ACTION, SAVED_ACTION, UPDATE_ACTION, SET_CURRENT_ACTION, REQUEST_ACTIONS, RECEIVE_ACTIONS} from '../actions'
import _ from 'lodash'

function currentAction(state = 0, action) {
  switch (action.type) {
    case SET_CURRENT_ACTION:
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
    case UPDATE_ACTION:
      const updater = a => _.merge({}, a, action.data);
      const idMatch = _.matchesProperty('id', action.id);
      return {
        ...state,
        actions: _.map(state.actions, applyFor(idMatch, updater))
      };
    case SAVING_ACTION:
      return {
        ...state,
        saving: true,
        modified: true
      };
    case SAVED_ACTION:
      return {
        ...state,
        saving: false,
        modified: true
      };
    case REQUEST_ACTIONS:
      return {
        ...state,
        loading: true
      };
    case RECEIVE_ACTIONS:
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

const organizerApp = combineReducers({actions, currentAction})

export default organizerApp

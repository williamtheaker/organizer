import { combineReducers } from 'redux'
import {SET_CURRENT_ACTION, REQUEST_ACTIONS, RECEIVE_ACTIONS} from '../actions'
import _ from 'lodash'

function currentAction(state = 0, action) {
  switch (action.type) {
    case SET_CURRENT_ACTION:
      return action.id;
    default:
      return state
  }
}

function actions(state = {}, action) {
  switch (action.type) {
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
        actions: [],
        ...state
      }
  }
}

const organizerApp = combineReducers({actions, currentAction})

export default organizerApp

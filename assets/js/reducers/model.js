import * as Actions from '../actions'
import _ from 'lodash'

function applyFor(matcher, func) {
  return o => {
    if (matcher(o)) {
      return func(o);
    }
    return o;
  }
}

export default function(state = {}, action) {
  switch (action.type) {
    case Actions.Model.UPDATE_MODEL:
      const updater = m => _.merge({}, m, action.data);
      const idMatch = _.matchesProperty('id', action.id);
      return {
        ...state,
        models: {
          ...state.models,
          [action.name]: _.map(state.models[action.name], applyFor(idMatch, updater))
        }
      };
    case Actions.Model.SAVING_MODEL:
      return {
        ...state,
        saving: true,
        modified: true
      };
    case Actions.Model.SAVED_MODEL:
      return {
        ...state,
        saving: false,
        modified: true
      };
    case Actions.Model.REQUEST_MODELS:
      return {
        ...state,
        loading: true
      };
    case Actions.Model.RECEIVE_MODELS:
      return {
        ...state,
        loading: false,
        models: {
          ...state.models,
          [action.name]: _.unionBy(state.models[action.name], action.models, a => a.id)
        }
      };
    default:
      return {
        loading: false,
        saving: false,
        modified: false,
        models: {},
        ...state
      };
  }
}

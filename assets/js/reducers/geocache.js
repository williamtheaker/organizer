import * as Actions from '../actions'
import _ from 'lodash'

export default function(state = {}, action) {
  switch (action.type) {
    case Actions.Geocache.REQUEST_GEOCODE:
      return {
        ...state,
        cache: {
          [action.address]: {},
          ...state.cache
        }
      };
    case Actions.Geocache.RECEIVE_GEOCODE:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.address]: action.geo
        }
      };
    default:
      return {
        cache: {},
        ...state
      }
  }
}

import { createSelector } from 'reselect'
import slug from 'slug'
import moment from 'moment'
import _ from 'lodash'

const cookAction = action => {
  return {
    ...action,
    slug: slug(action.name || 'Untitled'),
    date: moment(action.date)
  }
}

export const getAllModels = state => state.model.models;

function modelGetter(name, cooker = _.identity, filter = _.constant(true)) {
  return createSelector(
    [getAllModels],
    models => {
      const myModels = _.get(models, name, []);
      const cookedModels = _.map(myModels, cooker);
      const filteredModels = _.filter(cookedModels, filter)
      return filteredModels;
    }
  )
}

export function modelFinder(name, property, value, cooker = _.identity) {
  return createSelector(
    [modelGetter(name, cooker, _.matchesProperty(property, value))],
    models => models[0]
  )
}

export const getGeocache = state => state.geocache.cache;

export const getActions = modelGetter('actions', cookAction);
export const getSignups = modelGetter('signups');

export const getSignupsByState = state => modelGetter('signups', _.identity, _.matchesProperty('state', state))

export const getActionById = id => modelFinder('actions', 'id', id)

export const getCurrentID = state => state.currentAction.id;

export const getCurrentAction = createSelector(
  [getCurrentID, getActions],
  (id, actions) =>  {
    return _.filter(actions, _.matchesProperty('id', id))[0]
  }
)

export const getCurrentUser = state => state.auth.user;
export const getLoggedIn = createSelector(
  [getCurrentUser],
  currentUser => !!currentUser.id
)

export const getModified = state => state.modified
export const getSaving = state => state.saving
export const getLoading = state => state.loading

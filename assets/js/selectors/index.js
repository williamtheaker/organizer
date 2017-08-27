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
    models => _.filter(_.map(_.get(models, name, []), cooker), filter)
  )
}

export const getActions = modelGetter('actions', cookAction);
export const getSignups = modelGetter('signups');

export const getSignupsByState = state => modelGetter('signups', _.matchesProperty('state', state))

export const getActionById = id => modelGetter('actions', _.matchesProperty('id', id));

export const getCurrentID = state => state.currentAction;

export const getCurrentAction = createSelector(
  [getCurrentID, getActions],
  (currentId, actions) => {
    const filter = _.matchesProperty('id', currentId);
    return _.find(actions, filter) || cookAction({});
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

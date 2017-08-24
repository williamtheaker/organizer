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

function modelGetter(name, cooker = _.identity) {
  return createSelector(
    [getAllModels],
    models => _.map(_.get(models, name, []), cooker)
  )
}

export const getActions = modelGetter('actions', cookAction);

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

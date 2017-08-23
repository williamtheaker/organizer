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

export const getCurrentID = state => state.currentAction;
export const getActions = state => _.map(state.actions.actions, cookAction);

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

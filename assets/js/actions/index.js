import { Action, ActionCollection } from '../Model'

export const SET_CURRENT_ACTION = 'SET_CURRENT_ACTION'
export const REQUEST_ACTIONS = 'REQUEST_ACTIONS'
export const RECEIVE_ACTIONS = 'RECEIVE_ACTIONS'

function shouldFetchAction(state, id) {
  const filter = _.matchesProperty('id', state.currentAction);
  const action = _.find(state.actions.actions, filter) || new Action();
  if (action) {
    return true;
  } else {
    return true;
  }
}

export const fetchActionIfNeeded = (id) => {
  return (dispatch, getState) => {
    if (shouldFetchAction(getState(), id)) {
      return dispatch(fetchOneAction(id));
    }
  }
}

export const setCurrentAction = (id) => {
  return {
    type: SET_CURRENT_ACTION,
    id: Number(id)
  }
}

export const requestActions = () => {
  return {
    type: REQUEST_ACTIONS
  }
}

export const receiveActions = (actions) => {
  return {
    type: RECEIVE_ACTIONS,
    actions: actions
  }
}

export const fetchOneAction = (id) => {
  return dispatch => {
    const c = new ActionCollection();
    return fetch('/api/actions/'+id+'/', {credentials: 'include'}).then(response => response.json()).then((json) => {
      dispatch(receiveActions([new Action(json)]))
    });
  }
}

export const fetchActions = () => {
  return dispatch => {
    dispatch(requestActions());
    const c = new ActionCollection();
    return fetch('/api/actions/', {credentials: 'include'}).then(response => response.json()).then((json) => {
      dispatch(receiveActions(_.map(json.results, a => new Action(a))))
    });
  }
}

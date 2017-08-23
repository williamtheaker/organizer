import { normalize, schema } from 'normalizr';
import { csrftoken } from '../Django'

export const UPDATE_ACTION = 'UPDATE_ACTION'
export const SET_CURRENT_ACTION = 'SET_CURRENT_ACTION'
export const REQUEST_ACTIONS = 'REQUEST_ACTIONS'
export const RECEIVE_ACTIONS = 'RECEIVE_ACTIONS'
export const SAVING_ACTION = 'SAVING_ACTION'
export const SAVED_ACTION = 'SAVED_ACTION'

export const REQUEST_USER = 'REQUEST_USER'
export const RECEIVE_USER = 'RECEIVE_USER'

function getAction(state, id) {
  const filter = _.matchesProperty('id', state.currentAction);
  return _.find(state.actions.actions, filter) || {};
}

function shouldFetchAction(state, id) {
  const action = getAction(state, id);
  if (action) {
    return true;
  } else {
    return true;
  }
}

function shouldFetchUser(state) {
  const validID = !!state.auth.user.id;
  const isLoading = state.auth.loading;
  if (validID) {
    return false;
  } else {
    return !isLoading;
  }
}

export const logout = () => {
  return dispatch(receiveUser({}));
}

export const login = () => {
  return (dispatch, getState) => {
    if (shouldFetchUser(getState())) {
      dispatch(loadingUser());
      const data = {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrftoken
        }
      };
      return fetch("/api/users/me/", data).then(response => {
        return dispatch(receiveUser(response.data));
      });
    }
  }
}

export const saveAction = (id) => {
  return (dispatch, getState) => {
    const action = getAction(getState(), id);
    dispatch(savingAction(id));
    const data = {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrftoken
      },
      body: action
    };
    return fetch("/api/actions/"+id+"/", data).then(() => {
      dispatch(savedAction(id));
    });
  }
}

export const fetchActionIfNeeded = (id) => {
  return (dispatch, getState) => {
    if (shouldFetchAction(getState(), id)) {
      return dispatch(fetchOneAction(id));
    }
  }
}

export const updateAndSaveAction = (id, data) => {
  return dispatch => {
    dispatch(updateAction(id, data));
    return dispatch(saveAction(id));
  }
}

export const updateAction = (id, data) => {
  return {
    type: UPDATE_ACTION,
    id: id,
    data: data
  }
}

export const receiveUser = (u) => {
  return {
    type: RECEIVE_USER,
    user: u
  }
}

export const requestUser = () => {
  return {
    type: REQUEST_USER,
  }
}

export const setCurrentAction = (id) => {
  return {
    type: SET_CURRENT_ACTION,
    id: Number(id)
  }
}

export const savingAction = (id) => {
  return {
    type: SAVING_ACTION,
    id: Number(id)
  }
}

export const savedAction = (id) => {
  return {
    type: SAVED_ACTION,
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
    actions: actions || []
  }
}

export const fetchOneAction = (id) => {
  return dispatch => {
    return fetch('/api/actions/'+id+'/', {credentials: 'include'}).then(response => response.json()).then((json) => {
      dispatch(receiveActions([json]))
    });
  }
}

export const fetchActions = () => {
  return dispatch => {
    dispatch(requestActions());
    return fetch('/api/actions/', {credentials: 'include'}).then(response => response.json()).then((json) => {
      dispatch(receiveActions(json.results))
    });
  }
}

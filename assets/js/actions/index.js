import { csrftoken } from '../Django'

import * as _model from './model'
export const Model = _model;

import * as _geocache from './geocache'
export const Geocache = _geocache

export const REQUEST_USER = 'REQUEST_USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const SET_CURRENT_ACTION = 'SET_CURRENT_ACTION'

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
  return receiveUser({});
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

export const saveAction = (id) => {
  return Model.saveModel('actions', id);
}

export const fetchActionIfNeeded = (id) => {
  return Model.fetchModelIfNeeded('actions', id);
}

export const updateAndSaveAction = (id, data) => {
  return Model.updateAndSaveModel('actions', id, data);
}

export const updateAction = (id, data) => {
  return Model.updateModel('actions', id, data);
}


export const requestActions = () => {
  return Model.requestModels('actions');
}

export const receiveActions = (actions) => {
  return Model.receiveModels('actions', actions);
}

export const fetchOneAction = (id) => {
  return Model.fetchOneModel('actions', id);
}

export const fetchActions = () => {
  return Model.fetchModels('actions');
}

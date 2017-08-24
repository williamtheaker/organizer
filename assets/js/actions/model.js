export const REQUEST_MODELS = 'REQUEST_MODELS';
export const RECEIVE_MODELS = 'RECEIVE_MODELS';
export const UPDATE_MODEL = 'UPDATE_MODEL';
export const SAVING_MODEL = 'SAVING_MODEL';
export const SAVED_MODEL = 'SAVED_MODEL';

export const requestModels = name => {
  return {
    type: REQUEST_MODELS,
    name: name
  }
}

export const receiveModels = (name, models) => {
  return {
    type: RECEIVE_MODELS,
    name: name,
    models: models || []
  }
}

export const updateModel = (name, id, data) => {
  return {
    type: UPDATE_MODEL,
    id: id,
    data: data,
    name: name
  }
}

export const savingModel = (name, id) => {
  return {
    type: SAVING_MODEL,
    id: Number(id)
  }
}

export const savedModel = (name, id) => {
  return {
    type: SAVED_MODEL,
    id: Number(id)
  }
}

function getModel(name, state, id) {
  const filter = _.matchesProperty('id', state.currentAction);
  return _.find(_.get(state.model.models, name, []), filter) || {};
}

function shouldFetchModel(name, state, id) {
  const model = getModel(name, state, id);
  if (model) {
    return false;
  } else {
    return true;
  }
}

export const fetchModelIfNeeded = (name, id) => {
  return (dispatch, getState) => {
    if (shouldFetchModel(name, getState(), id)) {
      return dispatch(fetchOneModel(name, id));
    }
  }
}

export const updateAndSaveModel = (name, id) => {
  return dispatch => {
    dispatch(updateModel(name, id, data));
    return dispatch(saveModel(name, id));
  }
}

export const fetchOneModel = (name, id) => {
  return dispatch => {
    return fetch('/api/'+name+'/'+id+'/', {credentials: 'include'})
      .then(response => response.json())
      .then(json => {
        return dispatch(receiveModels(name, [json]));
      });
  }
}

export const fetchModels = (name) => {
  return dispatch => {
    dispatch(requestModels(name));
    return fetch('/api/'+name+'/', {credentials: 'include'})
      .then(response => response.json())
      .then(json => {
        dispatch(receiveModels(name, json.results));
      });
  }
}

export const saveModel = (name, id) => {
  return (dispatch, getState) => {
    const model = getModel(name, getState(), id);
    dispatch(savingModel(name, id));
    const data = {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrftoken
      },
      body: model
    };
    return fetch("/api/"+name+"/"+id+"/", data).then(() => {
      dispatch(savedModel(name, id));
    });
  }
}

import * as Model from '../store/model'
import _ from 'lodash'

function applyFor(matcher, func) {
    return o => {
        if (matcher(o)) {
            return func(o)
        }
        return o
    }
}

export default function(state = {}, action) {
    switch (action.type) {
    case Model.UPDATE_MODEL: {
        const updater = m => ({...m, ...action.data})
        const idMatch = _.matchesProperty('id', action.id)
        return {
            ...state,
            models: {
                ...state.models,
                [action.name]: _.map(_.get(state.models, action.name, []), applyFor(idMatch, updater))
            }
        }
    }
    case Model.SAVING_MODEL:
        return {
            ...state,
            saving: true,
            modified: true
        }
    case Model.SAVED_MODEL:
        return {
            ...state,
            saving: false,
            modified: true
        }
    case Model.REQUEST_MODELS:
        return {
            ...state,
            loading: true
        }
    case Model.RECEIVE_MODELS:
        return {
            ...state,
            loading: false,
            models: {
                ...state.models,
                [action.name]: [...action.models, ..._.get(state.models, action.name, [])]
            }
        }
    default:
        return {
            loading: false,
            saving: false,
            modified: false,
            models: {},
            ...state
        }
    }
}

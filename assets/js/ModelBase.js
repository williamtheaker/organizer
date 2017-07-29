import AmpersandFetch from 'ampersand-fetch'
import AmpersandModel from 'ampersand-model'
import AmpersandRestCollection from 'ampersand-rest-collection'
import moment from 'moment'
import _ from 'lodash'
import { csrftoken } from './Django'

const DjangoFetch = (method, model, options) => {
  options = {...options, credentials: 'include'}
  return AmpersandFetch(method, model, options).then((response) => {
    return response.json()
      .then((body) => {
        if (options.success && _.isFunction(options.success)) {
          options.success(body);
        }
        return Promise.resolve(response);
      }, (err) => {
        if (options.success && _.isFunction(options.success)) {
          options.success();
        }
        return Promise.resolve(response);
      })
  });
}

const DjangoConfig = () => {
  return {
    headers: {
      'X-CSRFToken': csrftoken,
    },
  }
}

export const DjangoModel = AmpersandModel.extend({
  ajaxConfig: DjangoConfig,
  sync: DjangoFetch,
  props: {
    id: 'number'
  },
  dataTypes: {
    moment: {
      set(v) {
        return {type: 'moment', val: moment(v)};
      },
      default() {
        return moment();
      }
    }
  },
  derived: {
    url: {
      deps: ['id'],
      fn() {
        return this.getId() ? (this.urlRoot + this.getId() + '/') : this.urlRoot;
      }
    }
  }
})

export const DjangoCollection = AmpersandRestCollection.extend({
  ajaxConfig: DjangoConfig,
  parse(response) {
    if (response.results) {
      return response.results;
    } else {
      return response;
    }
  }
})


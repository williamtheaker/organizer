import AmpersandFetch from 'ampersand-fetch'
import AmpersandModel from 'ampersand-model'
import AmpersandRestCollection from 'ampersand-rest-collection'
import moment from 'moment'
import { csrftoken } from './Django'

const DjangoConfig = () => {
  return {
    headers: {
      'X-CSRFToken': csrftoken
    },
  }
}

export const DjangoModel = AmpersandModel.extend({
  ajaxConfig: DjangoConfig,
  sync: AmpersandFetch,
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


import { csrftoken } from './Django'
import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'

const Client = axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
});

export default Client;

const modelProxyHooks = {
  get: (target, propKey, receiver) => {
    return target.get(propKey) || target[propKey];
  },
  set: (target, propKey, value, receiver) => {
    return target.set(propKey, value) || (target[propKey] = value)
  },
  has: (target, propKey) => {
    return target.has(propKey) || propKey in target[propKey];
  },
  getOwnPropertyDescriptor: (target, propKey) => {
    if (target.has(propKey)) {
      return {
        enumerable: true,
        configurable: true
      }
    } else {
      return {
        enumerable: false,
        configurable: false
      }
    }
  },
  ownKeys: (target) => {
    return _.keys(target.data);
  }
}

const createModel = ({name, url}) => {
  const baseUrl = url || `/api/${name}/`
  class ModelInstance {
    constructor(data) {
      this.loadFromJSON(data);
      this.changed = {}
      this.client = axios.create({baseURL: baseUrl});
      return new Proxy(this, modelProxyHooks);
    }

    get(property) {
      if (this.changed[property]) {
        return this.changed[property].value
      } else {
        if (property in ModelInstance.fields) {
          return ModelInstance.fields[property](this.data[property]);
        } else {
          return this.data[property]
        }
      }
    }

    has(property) {
      return property in this.data
    }

    loadFromJSON(data) {
      if (data) {
        this.data = data
        this.changed = {}
        this.isNew = false;
      }
    }

    sync() {
      const data = _.mapValues(this.changed, v => v.value)
      if (this.isNew) {
        return this.client.post('', data)
          .then(response => this.data = r.data);
      } else {
        return this.client.patch(id, data);
      }
    }

    set(property, value) {
      if (this.data[property] != value) {
        this.changed[property] = {value: value}
      } else {
        delete this.changed[property];
      }
    }

    static setFields(fields) {
      ModelInstance.fields = fields;
    }

    static getByID(id) {
      return Client.get(`${baseUrl}/${id}`)
        .then(response => new ModelInstance(response.data))
    }

    static getAll() {
      return Client.get(baseUrl)
        .then(response => _.map(response.data.results, (row) => new ModelInstance(row)))
    }
  }
  ModelInstance.fields = [];
  return ModelInstance;
}

class SchemaBase {
  constructor() {
    this.models = new Proxy({}, {
      get(target, propKey, receiver) {
        if (!(propKey in target)) {
          target[propKey] = createModel({name: propKey});
        }
        return target[propKey];
      }
    });
  }
}

export let Schema = new SchemaBase();
export let Activist = Schema.models.activists;
Activist.setFields({
  'created': (d) => moment(d).format('dddd, MMMM Do YYYY, h:mm:ss a')
})

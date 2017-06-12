import { csrftoken } from './Django'
import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'
import urljoin from 'url-join'
import PSemaphore from 'promise-semaphore'

const axiosConfig = {
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
}

const Client = axios.create(axiosConfig);

const workPool = new PSemaphore({
  rooms: 1
})

export default Client;

const modelProxyHooks = {
  get(target, propKey, receiver) {
    return target.get(propKey) || target[propKey];
  },
  set(target, propKey, value, receiver) {
    target.set(propKey, value) || (target[propKey] = value)
    return true;
  },
  has(target, propKey) {
    return target.has(propKey) || propKey in target[propKey];
  },
  getOwnPropertyDescriptor(target, propKey) {
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
  ownKeys(target) {
    return _.keys(target.data);
  }
}

class Model {}

const createModel = ({name, url, fields, instance_routes, routes, related_filters}) => {
  const baseUrl = url || urljoin('/api', name)+'/'
  fields = fields || []
  related_filters = related_filters || {};

  const modelClient = axios.create({...axiosConfig, baseURL: baseUrl});

  class ModelInstance extends Model {
    constructor(data) {
      super(data);
      this.loadFromJSON(data);
      this.encodeField = _.memoize(this.encodeField);
      this.decodeField = _.memoize(this.decodeField);
      return new Proxy(this, modelProxyHooks);
    }

    static get name() { return name }

    getClient() {
      return axios.create({...axiosConfig, baseURL: urljoin(baseUrl, this.data.id)});
    }

    sync() {
      const data = _.mapValues(this.changed, v => v.value)
      if (this.isNew()) {
        const newData = _.mapValues({...this.data, ...data}, (v, name) => (
          this.encodeField(name, v)
        ));
        console.log("Creating new", newData);
        return ModelInstance.client.post('', newData)
          .then(({data}) => {
            this.loadFromJSON(data);
            return this
          })
      } else {
        console.log("Updating", data);
        return this.getClient().patch(this.id+'/', data)
          .then(({data}) => {
            this.updateFromJSON(data);
            return this
          });
      }
    }

    loadFromJSON(data) {
      if (data) {
        this.data = data
      }
      this.changed = {}
    }

    updateFromJSON(data) {
      if (data) {
        this.data = {...this.data, ...data}
        this.changed = _.filter(this.changed, (_, key) => key in data)
      }
    }


    encodeField(name, value) {
      if (fields[name] && 'encode' in fields[name]) {
        return fields[name].encode(value);
      }
      return value;
    }

    decodeField(name, value) {
      if (name in fields && 'decode' in fields[name]) {
        return fields[name].decode(value);
      }
      return value;
    }

    get(property) {
      if (this.changed[property]) {
        return this.changed[property].value
      } else {
        return this.decodeField(property, this.data[property]);
      }
    }

    has(property) {
      return property in this.data
    }

    isNew() {
      return !('id' in this.data)
    }

    set(property, value) {
      if (this.data[property] != value) {
        this.changed[property] = {value: value}
      } else {
        delete this.changed[property];
      }
    }

    toString() {
      return this.get('name') || this.get('label')
    }

    getId() {
      return this.get('id') || this.get('url')
    }

    static create(data) {
      return new ModelInstance(data);
    }

    static getByID(id) {
      return ModelInstance.client.get(id + '/')
        .then(response => new ModelInstance(response.data))
    }

    static getByUrl(url) {
      return workPool.add(() => ModelInstance.client.get(url)
        .then(response => new ModelInstance(response.data)))
    }

    static getAll(options) {
      const cleanOptions = options || {};
      return ModelInstance.client.get('', {params: cleanOptions})
        .then(response => _.map(response.data.results, (row) => new ModelInstance(row)))
    }

    static getFields() {
      return ModelInstance.client.get('fields/')
        .then(response => response.data.fields);
    }
  }
  ModelInstance.client = modelClient;
  ModelInstance.related_filters = related_filters;
  ModelInstance.fields = fields;
  // Add instance routes to model type
  _.forIn(instance_routes, (route, name) => {
    ModelInstance.prototype[name] = route;
  });
  // Add class routes to model type
  _.forIn(routes, (route, name) => {
    ModelInstance[name] = route;
  });
  return ModelInstance
}

export let Action = createModel({
  name: 'actions',
  fields: {
    'date': {decode:(d) => moment(d).format('dddd, MMMM Do YYYY, h:mm:ss a')}
  },
  instance_routes: {
    bulk_add_activists(activists) {
      const data = {
        activists: _.map(activists, a => a.url)
      }
      return Action.client.post('bulk_add_activists/', data)
    }
  }
})

export let User = createModel({
  name: 'users',
  routes: {
    logout() {
      return Client.get('/api/users/logout/')
    }
  }
})

class HyperlinkRelationField {
  constructor(model) {
    this.model = model;
    this.encode = _.memoize(this.encode.bind(this));
    this.decode = _.memoize(this.decode.bind(this));
  }

  encode(value) {
    return value.url
  }

  decode(value) {
    return this.model.getByUrl(value)
  }
}

class ListField {
  constructor(subtype) {
    this.subtype = subtype
    this.encode = this.encode.bind(this);
    this.decode = this.decode.bind(this);
  }

  encode(value) {
    return _.map(value, this.subtype.encode);
  }

  decode(value) {
    return Promise.all(_.map(value, v => Promise.resolve(this.subtype.decode(v))));
  }
}

export let District = createModel({
  name: 'districts',
})

export let City = createModel({
  name: 'cities',
})

export let Signup = createModel({
  name: 'signups',
  fields: {
    'action': new HyperlinkRelationField(Action),
    //'activist': new HyperlinkRelationField('activists')
  },
  related_filters: {
    'activist__address__locality': City,
    'activist__district_memberships__district': District,
    'action': Action
  }
})

export let Activist = createModel({
  name: 'activists',
  fields: {
    'date': {decode: (d) => moment(d).format('dddd, MMMM Do YYYY, h:mm:ss a')},
    'signups': new ListField(new HyperlinkRelationField(Signup))
  },
  related_filters: {
    'signups__action': Action,
    'district_memberships__district': District,
    'address__locality': City
  }
});

export let Form = createModel({
  name: 'forms',
  related_filters: {
    'action': Action
  }
});

export let FormResponse = createModel({
  name: 'formresponses'
});

if (module.hot) {
  module.hot.decline();
}

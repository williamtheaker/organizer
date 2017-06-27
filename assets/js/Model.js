import React from 'react'
import Events from 'ampersand-events'
import AmpersandModel from 'ampersand-model'
import AmpersandCollection from 'ampersand-collection'
import AmpersandRestCollection from 'ampersand-rest-collection'
import _ from 'lodash'
import moment from 'moment'
import slug from 'slug'

import { csrftoken } from './Django'

const DjangoConfig = () => {
  return {
    headers: {
      'X-CSRFToken': csrftoken
    }
  }
}

export const DjangoModel = AmpersandModel.extend({
  ajaxConfig: DjangoConfig,
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

export const Activist = DjangoModel.extend({
  urlRoot: '/api/activists/',
  props: {
    address: 'string',
    created: 'string',
    email: 'string',
    name: 'string',
    rank: 'number',
  }
});

export const Signup = DjangoModel.extend({
  urlRoot: '/api/signups/',
  props: {
    state: 'string',
    action: 'string',
  },
  toJSON() {
    return {...this.serialize(), ...{activist: this.activist.url}};
  },
  children: {
    activist: Activist
  }
});

export const SignupCollection = DjangoCollection.extend({
  url: '/api/signups/',
  model: Signup,
})

export const ActivistCollection = DjangoCollection.extend({
  url: '/api/activists/',
  model: Activist
})

export const Action = DjangoModel.extend({
  urlRoot: '/api/actions/',
  props: {
    name: ['string', true, () => "Untitled"],
    date: ['moment', true, () => moment()],
    fields: ['array', false, () => []],
    forms: ['array', false, () => []]
  },
  derived: {
    slug: {
      deps: ['name'],
      type: 'string',
      fn() {
        return slug(this.name);
      }
    }
  },
  collections: {
    signups: SignupCollection,
    //forms: FormCollection,
    //fields: FieldCollection
  }
});

export const ActionCollection = DjangoCollection.extend({
  url: '/api/actions/',
  model: Action
})

export const Form = DjangoModel.extend({
  urlRoot: '/api/forms/',
  props: {
    active: 'boolean',
    description: 'string',
    next_state: 'string',
    title: 'string'
  },
  collections: {
    //fields: FieldCollection
  },
  children: {
    action: Action
  }
});

export const FormCollection = DjangoCollection.extend({
  url: '/api/forms/',
  model: Form
});

export const SubmissionField = AmpersandModel.extend({
  props: {
    id: 'number',
    value: 'string'
  }
});

export const SubmissionFieldCollection = AmpersandCollection.extend({
  model: SubmissionField
});

export const Submission = DjangoModel.extend({
  props: {
    name: 'string',
    email: 'string',
    address: 'string',
    form: Form,
  },
  collections: {
    fields: SubmissionFieldCollection
  },
  toJSON() {
    const serialized = this.serialize('props');
    var fieldValues = {}
    _.each(this.fields, field => {
      fieldValues['input_'+field.id] = field.value;
    })
    return {...serialized, ...fieldValues};
  },
  derived: {
    url: {
      deps: ['*'],
      fn() {
        return '/api/forms/'+this.form.id+'/submit_response/'
      }
    }
  }
});

export function bindToState(self, state, propMap) {
  _.each(_.keys(propMap), propName => {
    state.on('change:'+propName, () => {
      var nextState = {};
      nextState[propName] = state[propName];
      self.setState(nextState);
    })
  })
}

export function bindToCollection(self, collection, key) {
  collection.on('add remove change', () => {
    var nextState = {};
    nextState[key] = collection.models;
    self.setState(nextState);
  });
}

export function withState(Component) {
  return class StateBinding extends React.Component {
    constructor(props) {
      super(props);
      Events.createEmitter(this);
      this.onUpdate = _.debounce(this.onUpdate.bind(this), 100);
      this.state = {updateHash: 0};
      this.mounted = false;
    }

    componentDidMount() {
      this.mounted = true;
      this.rebindProps({}, this.props);
    }

    componentWillUnmount() {
      this.mounted = false;
      this.stopListening();
    }

    onUpdate() {
      if (this.mounted) {
        this.setState({updateHash: this.state.updateHash+1});
      }
    }

    rebindProps(oldProps, nextProps) {
      const nextStates    = _.filter(_.values(nextProps), p => p.isState);
      const currentStates = _.filter(_.values(oldProps), p => p.isState);
      const removedStates = _.difference(currentStates, nextStates);
      const addedStates   = _.difference(nextStates, currentStates);

      _.each(removedStates, this.stopListening);
      _.each(addedStates,   s => this.listenTo(s, 'change', this.onUpdate));
    }

    componentWillReceiveProps(nextProps) {
      this.rebindProps(this.props, nextProps);
    }

    render() {
      return <Component {...this.props} />
    }
  }
}

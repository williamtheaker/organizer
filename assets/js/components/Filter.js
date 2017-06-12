import React from 'react'
import _ from 'lodash'
import Select from 'react-select'
import FilterInput from './FilterInput'
import { FormInput } from 'react-form'

export default class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.loadOptions = _.memoize(this.loadOptions.bind(this));
    this.state = {value: {}}
  }

  loadFieldOptionsForType(model, label, fieldPrefix) {
    const prefix = fieldPrefix || '';
    return model.getFields()
      .then(fields => (
        _.map(fields, f => (
          {label: `${label} ${f.label}`, value: prefix+f.key, type: 'string'}
        ))
      ));
  }

  loadOptionsForType(model, label, field) {
    return [
      {label: label, type: 'model', value: field, model: model}
    ];
  }

  loadRelatedFilters(model) {
    var ret = []
    _.forIn(model.related_filters, (model, field) => 
      ret.push({label: model.name, type: 'model', value: field, model: model})
    )
    return Promise.resolve(ret);
  }

  loadOptions(value) {
    return Promise.all([
      this.loadFieldOptionsForType(this.props.store.model, this.props.store.model.name),
      this.loadRelatedFilters(this.props.store.model)
    ]).then(_.spread(_.concat)).then(v => ({options: v}))
  }

  setKey(value) {
    this.setState({value: value});
  }

  render() {
    return (
      <div className="row">
        <div className="small-1 columns">
          <button className="button" onClick={this.props.removeValue}>-</button>
        </div>
        <div className="small-3 columns">
          <FormInput field="key" >
            {({getValue, setValue}) => (
              <Select.Async value={getValue()} onChange={(v) => {setValue(v);this.setKey(v)}} loadOptions={this.loadOptions}/>
            )}
          </FormInput>
        </div>
        <FilterInput value={this.state.value} />
      </div>
    )
  }
}

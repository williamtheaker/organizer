import React from 'react'
import _ from 'lodash'
import { Text, FormInput } from 'react-form'
import Select from 'react-select'

function makeOption(k, v) {
  return {value: v, label: k}
}

export default class FilterInput extends React.Component {
  loadOptions(value) {
    return this.props.value.model.getAll()
      .then(models => {
        return _.map(models, row => ({
          label: row.toString(),
          value: row.getId()
        }))
      }).then(options => ({options: options}));
  }

  render() {
    const stringOperators = [
      makeOption('Contains', 'contains'),
      makeOption('Equals', 'equals')
    ];
    const type = this.props.value ? this.props.value.type : '';
    switch (type) {
      case 'string':
        return (
          <div>
            <div className="small-3 columns">
              <FormInput field="operator">
                {({getValue, setValue}) => (
                  <Select value={getValue()} onChange={setValue} options={stringOperators}/>
                )}
              </FormInput>
            </div>
            <div className="small-5 columns">
              <Text type="text" field="value"/>
            </div>
          </div>
        );
      case 'model':
        return (
          <div className="small-8 columns">
            <FormInput field="model_id">
              {({getValue, setValue}) => (
                <Select.Async value={getValue()} onChange={setValue} loadOptions={() => this.loadOptions()}/>
              )}
            </FormInput>
          </div>
        )
      default:
        return <div className="small-8 columns"></div>
    }
  }
}



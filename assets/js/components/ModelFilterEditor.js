import React from 'react'
import { NestedForm, Form } from 'react-form'
import Filter from './Filter'
import _ from 'lodash'

export default class ModelFilterEditor extends React.Component {
  constructor(props) {
    super(props);
    this.doOnChange = this.doOnChange.bind(this);
  }

  doOnChange({values}) {
    var filters = {};
    const filterables = _.filter(values.filters, f => f);
    _.each(filterables, (values) => {
      const {model_id, operator, key} = _.mapValues(values, v => v ? v.value : {});
      const value = values.value;
      if (model_id) {
        filters[key] = model_id;
      } else if (operator == "contains") {
        filters[key+"__icontains"] = value;
      } else if (operator == "equals") {
        filters[key] = value;
      } else {
        console.log("unknown filter operator", operator);
      }
    });
    this.props.store.setOptions(filters);
  }

  render() {
    const defaults = {
      filters: []
    };
    return (
      <Form defaultValues={defaults} onChange={this.doOnChange}>
        {({values, addValue, removeValue}) => (
          <div className="filters">
            {_.map(values.filters, (filter, i) => (
              <div key={i}>
                <NestedForm field={['filters', i]}>
                  <Form>
                    <Filter
                      store={this.props.store}
                      removeValue={() => removeValue('filters', i)}
                    />
                  </Form>
                </NestedForm>
              </div>
            ))}
            <button className="button" onClick={() => addValue('filters', {})}>Add Filter</button>
          </div>
        )}
      </Form>
    );
  }
}

import React from 'react'
import StoreBinding from './StoreBinding'
import { ModelDataStore } from './RowDataStore'
import { Table } from './DataTable'
import { titles } from '../TitleManager'
import Select from 'react-select'
import _ from 'lodash'
import Gravatar from 'react-gravatar'
import Modal from 'react-modal'
import { Text, NestedForm, Form, FormInput } from 'react-form'
import { csrftoken } from '../Django'
import { City, Signup, Action, District, Activist } from '../API'
import { withRouter } from 'react-router'

function makeOption(k, v) {
  return {value: v, label: k}
}

class FilterInput extends React.Component {
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

class Filter extends React.Component {
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

  loadOptions(value) {
    return Promise.all([
      this.loadFieldOptionsForType(Activist, 'Activist'),
      this.loadOptionsForType(Action, 'Action', 'signups__action'),
      this.loadOptionsForType(District, 'District', 'district_memberships__district'),
      this.loadOptionsForType(City, 'City', 'address__locality'),
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

class ActivistFilterEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.doOnChange = this.doOnChange.bind(this);
  }

  doOnChange({values}) {
    this.props.onChange(values);
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

class BulkAddActivists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      action: []
    }
    this.loadOptions = this.loadOptions.bind(this);
    this.doChange = this.doChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  loadOptions(searchQuery) {
    return Action.getAll()
      .then(results => {
        return {options: _.map(results, r => ({label: r.name, value: r}))};
      });
  }

  doChange(value) {
    this.setState({action: value});
  }

  submit(values) {
    return Promise.all(_.map(values.actions, ({value}) => (
      value.bulk_add_activists(this.props.store_data.selected)
        .then((response) => {
          return response.data;
        })
    )));
  }

  render() {
    return (
      <div>
        <Form onSubmit={this.submit}>
          {({submitForm}) => (
            <form onSubmit={submitForm}>
              <p>Adding {this.props.store_data.selected.length} activists</p>
              <label>
                Campaign:
                <FormInput field="actions">
                  {({setValue, getValue}) => (
                    <Select.Async
                      multi
                      onChange={setValue}
                      value={getValue()}
                      loadOptions={this.loadOptions} />
                  )}
                </FormInput>
              </label>
              <button className="button" type="submit">Save</button>
            </form>
          )}
        </Form>
      </div>
    )
  }
}

export default class ActivistIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddToAction: false
    };
    this.store = new ModelDataStore(Activist);
    this.store.reload();
    this.doOnChange = _.throttle(this.doOnChange.bind(this), 500, {trailing: true});
  }

  componentDidMount() {
    titles.setSubtitle("Activists");
  }

  doOnChange(values) {
    var filters = {};
    const filterables = _.filter(values.filters, f => f);
    _.each(filterables, (values) => {
      const {model_id, operator, key} = _.mapValues(values, v => v.value);
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
    this.store.setOptions(filters);
  }

  render() {
    const columns = [
      {label: 'Name', value: 'name',
        cell: ({row}) => <span><Gravatar size={24} email={row.email} />{row.name}</span>},
      {label: 'Email', value: 'email'},
      {label: 'Address', value: 'address'},
    ];
    return (
      <div>
        <Modal
          isOpen={this.state.showAddToAction}
          contentLabel="Bulk add to action"
          onRequestClose={() => this.setState({showAddToAction: false})}>
          <StoreBinding store={this.store}>
            <BulkAddActivists />
          </StoreBinding>
        </Modal>
        <div className="row">
          <div className="small-12 columns">
            <ActivistFilterEditor onChange={this.doOnChange} />
            <div className="top-bar">
              <div className="top-bar-right">
                <ul className="menu">
                  <li><input type="button" className="button" value="Add to action" onClick={() => this.setState({showAddToAction: true})}/></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="small-12 columns">
            <StoreBinding store={this.store}>
              <Table columns={columns} />
            </StoreBinding>
          </div>
        </div>
      </div>
    )
  }
}

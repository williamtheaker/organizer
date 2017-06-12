import React from 'react'
import { ModelDataStore } from './RowDataStore'
import { titles } from '../TitleManager'
import Select from 'react-select'
import _ from 'lodash'
import Gravatar from 'react-gravatar'
import { Text, NestedForm, Form, FormInput } from 'react-form'
import { Action, Activist } from '../API'
import { withRouter } from 'react-router'
import ModelIndex from './ModelIndex'

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
          this.props.onFinished();
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
    this.store = new ModelDataStore(Activist);
  }

  componentDidMount() {
    titles.setSubtitle("Activists");
    this.store.reload();
  }

  render() {
    const actions = {
      bulkAddActivists: {label: "Add to action", component: BulkAddActivists}
    };
    const columns = [
      {label: 'Name', value: 'name',
        cell: ({row}) => <span><Gravatar size={24} email={row.email} />{row.name}</span>},
      {label: 'Email', value: 'email'},
      {label: 'Address', value: 'address'},
    ];
    return (
      <ModelIndex store={this.store} actions={actions} columns={columns} />
    )
  }
}

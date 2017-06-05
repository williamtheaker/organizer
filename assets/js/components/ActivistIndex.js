import React from 'react'
import StoreBinding from './StoreBinding'
import { ModelDataStore } from './RowDataStore'
import { Table } from './DataTable'
import { titles } from '../TitleManager'
import Select from 'react-select'
import axios from 'axios'
import _ from 'lodash'
import Gravatar from 'react-gravatar'
import Modal from 'react-modal'
import { Form, FormInput } from 'react-form'
import { csrftoken } from '../Django'
import { Action, Activist } from '../API'

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

class AddressSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {options: []}

    this.getOptions = this.getOptions.bind(this);
  }

  getOptions(value) {
    return axios.get('/api/cities/search/', {params: {q: value}})
      .then(response => {
        const options = _.map(
          response.data.results,
          city => ({value: city.id, label: city.name})
        )
        return {options: options};
      });
  }

  render() {
    return <Select.Async loadOptions={this.getOptions} {...this.props} />
  }
}

class AddressSearchFilterHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: []
    };
  }

  render() {
    return (
      <th>
        City
        <AddressSelect
          multi={true}
          value={this.state.value}
          onChange={value => {
            if (value.length == 0) {
              this.props.onFilterChanged(() => true);
            } else {
              const patterns = _.map(value, v => new RegExp(v.label, 'i'));
              this.props.onFilterChanged(data => _.some(patterns, p => data && data.match(p)));
            }
            this.setState({value: value});
          }}
          multi={true}
        />
      </th>
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
  }

  componentDidMount() {
    titles.setSubtitle("Activists");
  }

  render() {
    const columns = [
      {label: 'Name', value: 'name',
        cell: ({row}) => <span><Gravatar size={24} email={row.email} />{row.name}</span>},
      {label: 'Email', value: 'email'},
      {label: 'Address', value: 'address', header: AddressSearchFilterHeader}
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

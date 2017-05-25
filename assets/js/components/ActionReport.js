import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import _ from 'underscore'
import Modal from 'react-modal'
import { csrftoken } from '../Django'
import EventEmitter from 'events'

function SignupStateSelect(props) {
  return (
    <select {...props}>
      <option value=''>All</option>
      <option value='0'>Prospective</option>
      <option value='1'>Confirmed</option>
      <option value='2'>Attended</option>
      <option value='3'>No-Show</option>
      <option value='4'>Cancelled</option>
    </select>
  )
}

class SignupRow extends React.Component {
  render() {
    const s = this.props.signup;
    var fieldValues = [];
    _.each(s.responses, (response) => {
      fieldValues.push((
        <td key={response.id}>{response.value}</td>
      ));
    });
    return (
      <tr key={s.activist.email}>
        <th><input type="checkbox" value={s.id} onChange={(evt) => this.props.onSelectedChange(evt.target.checked)} checked={this.props.selected}/></th>
        <td>{s.activist.name}</td>
        <td>{s.activist.email}</td>
        <td>{s.state_name}</td>
        {fieldValues}
      </tr>
    )
  }
}

class BulkStateEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nextState: 0,
      saving: false,
    }
  }

  save() {
    var requests = [];
    this.setState({saving: true});
    _.each(this.props.store_data.selected, (row) => {
      var data = {
        state: this.state.nextState
      };
      requests.push(axios.patch('/api/signups/'+row.id+'/', data, {headers: {'X-CSRFToken': csrftoken}}))
    });
    Promise.all(requests)
      .then(() => {
        this.setState({saving: false});
        this.props.onSaved();
    });
  }

  render() {
    return (
      <div>
        <SignupStateSelect
          onChange={(e) => this.setState({nextState: e.target.value})}
          value={this.state.nextState} />
        <input type="button" className="button" value={"Update "+this.props.store_data.selected.length+" rows"} onClick={() => this.save()} disabled={this.state.saving}/>
      </div>
    )
  }
}

class SignupStateFilterHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChanged = this.handleChanged.bind(this);
  }

  handleChanged(evt) {
    if (evt.target.value == '') {
      this.props.onFilterChanged(() => true);
    } else {
      var v = evt.target.value;
      this.props.onFilterChanged((d) => d == v);
    }
    this.setState({value: evt.target.value});
  }

  render() {
    return (
      <th>
        {this.props.name}
        <SignupStateSelect onChange={this.handleChanged} value={this.state.value} />
      </th>
    );
  }
}

class DataTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showBulkStateEdit: false,
    };
  }

  render() {
    var fieldHeaders = [];
    if (this.props.store_data.data.fields) {
      fieldHeaders = _.map(this.props.store_data.data.fields, (f) => (
          <th key={f.id}>{f.name}</th>
        )
      );
    }

    const rows = _.map(this.props.store_data.visible, (s) => (
      <SignupRow
        key={s.id}
        signup={s}
        selected={this.props.store.isSelected(s.id)}
        onSelectedChange={(selected) => this.props.store.setSelected(s.id, selected)} />
    ));

    return (
      <table className="data-table hover">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={(evt) => {this.props.store.setAllSelected(evt.target.checked)}} checked={this.props.store.areAllSelected()}/></th>
            <th>Name</th>
            <th>E-mail</th>
            <SignupStateFilterHeader
              name='Status'
              onFilterChanged={
                (value) => {
                  this.props.store.setFilter('state', value);
                }
              }/>
            {fieldHeaders}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }
}

class StoreBinding extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      store_data: {
        all: [],
        visible: [],
        selected: [],
        data: {}
      }
    }
    this.onStoreUpdated = this.onStoreUpdated.bind(this);
  }

  onStoreUpdated(bundle) {
    this.setState({store_data: bundle});
  }

  componentDidMount() {
    this.props.store.on('update', this.onStoreUpdated);
    this.props.store.notify();
  }

  componentWillUnmount() {
    this.props.store.removeListener('update', this.onStoreUpdated);
  }

  render() {
    return (
      <span>
        {React.cloneElement(this.props.children, {store: this.props.store, store_data: this.state.store_data})}
      </span>
    )
  }
}

class ActionStore extends EventEmitter {
  constructor() {
    super();
    this.data = {};
    this.filters = [];
    this.selected = [];
  }

  notify() {
    var dataBundle = {
      all: this.allItems(),
      visible: this.visibleItems(),
      selected: this.selectedItems(),
      data: this.data
    };
    this.emit('update', dataBundle);
  }

  reload(id) {
    return axios.get('/api/actions/'+id+'/')
      .then((results) => {
        titles.setTitle('Action Report', results.data.name);
        this.data = results.data;
        this.notify();
        return results;
      });
  }

  allItems() {
    if (this.data.signups) {
      return this.data.signups;
    } else {
      return [];
    }
  }

  visibleItems() {
    return _.filter(this.allItems(), this._runFilters, this)
  }

  selectedItems() {
    return _.filter(this.visibleItems(), (s) => {
      return this.selected[s.id];
    });
  }

  isSelected(id) {
    return this.selected[id];
  }

  setFilter(property, value) {
    this.filters[property] = value;
    this.notify();
  }

  setAllSelected(state) {
    _.each(this.allItems(), (s) => {
      this.selected[s.id] = state;
    });
    this.notify();
  }

  setSelected(rowID, state) {
    this.selected[rowID] = state;
    this.notify();
  }

  areAllSelected() {
    const items = this.visibleItems();
    if (items.length == 0) {
      return false;
    } else {
      return _.every(items, (item) => this.selected[item.id]);
    }
  }


  _runFilters(row) {
    return _.every(
      _.pairs(this.filters),
      (field) => {
        return field[1](row[field[0]]);
      }
    );
  }

}

export default class ActionReport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleFiltersChanged = this.handleFiltersChanged.bind(this);
    this.store = new ActionStore();
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    this.store.reload(this.props.match.params.id);
  }

  handleFiltersChanged(filters) {
    this.setState({filters: filters});
  }

  render() {
    // TODO: Add remove from action, send email buttons
    return (
      <div>
        <Modal
          isOpen={this.state.showBulkStateEdit}
          contentLabel="Bulk edit states"
          onRequestClose={() => {this.setState({showBulkStateEdit: false});}}>
          <StoreBinding store={this.store}>
            <BulkStateEditor onSaved={() => {this.setState({showBulkStateEdit: false});this.reload();}} />
          </StoreBinding>
        </Modal>
        <div className="row">
          <div className="small-12 columns">
            <div className="top-bar">
              <div className="top-bar-left">
                <ul className="menu">
                  <li><input type="search" placeholder="Search"/></li>
                  <li><button type="button" className="button">Search</button></li>
                </ul>
              </div>
              <div className="top-bar-right">
                <ul className="menu">
                  <li><input type="button" className="button" value="Edit state" onClick={() => {this.setState({showBulkStateEdit: true});}} /></li>
                  <li><input type="button" className="button" value="Refresh" onClick={() => this.reload()} /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="small-12 columns">
            <StoreBinding store={this.store}>
              <DataTable />
            </StoreBinding>
          </div>
        </div>
      </div>
    )
  }
}

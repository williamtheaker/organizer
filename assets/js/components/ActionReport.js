import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import _ from 'underscore'
import Modal from 'react-modal'
import { csrftoken } from '../Django'

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
    //areAllSelected = rowSelected && areAllSelected;
    return (
      <tr key={s.activist.email}>
        <th><input type="checkbox" onChange={(evt) => this.props.onSelectedChange(evt.target.checked)} checked={this.props.selected}/></th>
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
      saving: false
    }
  }

  save() {
    var requests = [];
    this.setState({saving: true});
    _.each(this.props.selectedRows, (row) => {
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
        <input type="button" className="button" value={"Update "+this.props.selectedRows.length+" rows"} onClick={() => this.save()} disabled={this.state.saving}/>
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
  _runFilters(row) {
    return _.every(
      _.pairs(this.state.filters),
      (field) => {
        return field[1](row[field[0]]);
      }
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      filters: [],
      selected: [],
      showBulkStateEdit: false
    };

    this.setSelected = this.setSelected.bind(this);
    this.setAllSelected = this.setAllSelected.bind(this);
  }

  allItems() {
    if (this.props.action) {
      return this.props.action.signups;
    } else {
      return [];
    }
  }

  visibleItems() {
    return _.filter(this.allItems(), this._runFilters, this)
  }

  selectedItems() {
    return _.filter(this.visibleItems(), (s) => {
      return this.state.selected[s.id];
    });
  }

  setFilter(property, value) {
    var currentFilters = this.state.filters;
    currentFilters[property] = value;
    this.setState({filters: currentFilters});
    console.log('Updating filter', property, value);
  }

  setAllSelected(state) {
    var currentSelected = this.state.selected;
    _.each(this.allItems(), (s) => {
      console.log("select all", s, state);
      currentSelected[s.id] = state;
    });
    this.setState({selected: currentSelected});
    this.props.onSelectedChanged(this.selectedItems());
  }

  setSelected(rowID, state) {
    var currentSelected = this.state.selected;
    currentSelected[rowID] = state;
    this.setState({selected: currentSelected});
    this.props.onSelectedChanged(this.selectedItems());
  }

  areAllSelected() {
    const items = this.visibleItems();
    if (items.length == 0) {
      return false;
    } else {
      return _.every(items, (item) => this.state.selected[item.id]);
    }
  }

  render() {
    var fieldHeaders = [];
    if (this.props.action) {
      fieldHeaders = _.map(this.props.action.fields, (f) => (
          <th key={f.id}>{f.name}</th>
        )
      );
    }

    const rows = _.map(this.visibleItems(), (s) => (
      <SignupRow
        key={s.id}
        signup={s}
        selected={this.state.selected[s.id]}
        onSelectedChange={(selected) => this.setSelected(s.id, selected)} />
    ));

    return (
      <table className="data-table hover">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={(evt) => {this.setAllSelected(evt.target.checked)}} checked={this.areAllSelected()}/></th>
            <th>Name</th>
            <th>E-mail</th>
            <SignupStateFilterHeader
              name='Status'
              onFilterChanged={
                (value) => {
                  this.setFilter('state', value);
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

export default class ActionReport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      action: undefined,
      filters: [],
      selected: []
    }
    this.handleFiltersChanged = this.handleFiltersChanged.bind(this);
  }

  reload() {
    this.setState({action: undefined});
    axios.get('/api/actions/'+this.props.match.params.id+'/')
      .then((results) => {
        titles.setTitle('Action Report', results.data.name);
        this.setState({action: results.data});
      });
  }

  componentDidMount() {
    this.reload();
  }

  handleFiltersChanged(filters) {
    console.log("new filters", filters);
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
          <BulkStateEditor onSaved={() => {this.setState({showBulkStateEdit: false});this.reload();}} selectedRows={this.state.selected} />
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
            <DataTable action={this.state.action} onSelectedChanged={(items) => this.setState({selected: items})}/>
          </div>
        </div>
      </div>
    )
  }
}

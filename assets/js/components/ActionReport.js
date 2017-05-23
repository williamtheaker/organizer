import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import _ from 'underscore'
import Modal from 'react-modal'

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class BulkStateEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nextState: 0,
      saving: false
    }
    this.csrftoken = getCookie('csrftoken');
  }

  save() {
    var requests = [];
    this.setState({saving: true});
    _.each(this.props.selectedRows, (row) => {
      var data = {
        state: this.state.nextState
      };
      requests.push(axios.patch('/api/signups/'+row.id+'/', data, {headers: {'X-CSRFToken': this.csrftoken}}))
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
        <select onChange={(e) => this.setState({nextState: e.target.value})} value={this.state.nextState}>
          <option value="0">Prospective</option>
          <option value="1">Confirmed</option>
        </select>
        <input type="button" className="button" value={"Update "+this.props.selectedRows.length+" rows"} onClick={() => this.save()} enabled={!this.state.saving}/>
      </div>
    )
  }
}

class FilterHeader extends React.Component {
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
    var filterOptions = [];
    filterOptions.push((
      <option key='' value=''>All</option>
    ));
    filterOptions.push((
      <option key='0' value='0'>Prospective</option>
    ));
    filterOptions.push((
      <option key='1' value='1'>Confirmed</option>
    ));
    return (
      <th>
        {this.props.name}
        <select onChange={this.handleChanged} value={this.state.value}>
          {filterOptions}
        </select>
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

  selectedItems() {
    return _.filter(this.props.action.signups, (s) => {
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
    _.each(this.props.action.signups, (s) => {
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

  render() {
    var rows = [];
    var fieldHeaders = [];
    var areAllSelected = true;
    if (this.props.action) {
      _.each(this.props.action.fields, (f) => {
        fieldHeaders.push((
          <th key={f.id}>{f.name}</th>
        ));
      });
      _.each(_.filter(this.props.action.signups, this._runFilters, this), (s) => {
        var fieldValues = [];
        _.each(s.responses, (response) => {
          fieldValues.push((
            <td key={response.id}>{response.value}</td>
          ));
        });
        var rowSelected = this.state.selected[s.id];
        areAllSelected = rowSelected && areAllSelected;
        rows.push((
          <tr key={s.activist.email}>
            <th><input type="checkbox" onChange={(evt) => {this.setSelected(s.id, evt.target.checked)}} checked={rowSelected}/></th>
            <td>{s.activist.name}</td>
            <td>{s.activist.email}</td>
            <td>{s.state_name}</td>
            {fieldValues}
          </tr>
        ));
      });
    }

    return (
      <table className="data-table hover">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={(evt) => {this.setAllSelected(evt.target.checked)}} checked={areAllSelected}/></th>
            <th>Name</th>
            <th>E-mail</th>
            <FilterHeader
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

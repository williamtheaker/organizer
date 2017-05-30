import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import _ from 'underscore'
import Modal from 'react-modal'
import { csrftoken } from '../Django'
import EventEmitter from 'events'
import RowDataStore from './RowDataStore'
import StoreBinding from './StoreBinding'
import { Table } from './DataTable'
import { Form, Text, FormInput } from 'react-form'
import { MarkdownEditor } from 'react-markdown-editor'
import Gravatar from 'react-gravatar'
import Select from 'react-select'
import 'react-select/dist/react-select.css';

function SignupStateSelect(props) {
  const options = [
    {value: '0', label: 'Prospective'},
    {value: '1', label: 'Confirmed'},
    {value: '2', label: 'Attended'},
    {value: '3', label: 'No-Show'},
    {value: '4', label: 'Cancelled'}
  ];
  return (
    <Select options={options} {...props} />
  )
}

class EmailEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sending: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(values) {
    console.log('submit!', values);
    var data = {
      subject: values.subject,
      body: values.body,
      signups: _.map(this.props.store_data.selected, ({id}) => id)
    };
    this.setState({sending: true});
    axios.post('/api/actions/'+this.props.action_id+'/email_activists/',
      data, {headers: {'X-CSRFToken': csrftoken}})
      .then((r) => {
        this.setState({sending: false});
        this.props.onSent();
      })
      .catch(() => {
        this.setState({sending: false});
      });
  }

  render() {
    return (
      <Form ref={(r) => {this._form = r}} onSubmit={this.handleSubmit}>
        {({submitForm}) => {
          return (
            <form method="post" onSubmit={submitForm}>
              <label>
                To:  {this.props.store_data.selected.length} activists
              </label>
              <label>Subject: <Text type='text' field='subject' /></label>
              <label>
                Body:
                <FormInput field='body'>
                  {({setValue, getValue}) => (
                    <MarkdownEditor
                      iconsSet="font-awesome"
                      initialContent=""
                      content={getValue()}
                      onContentChange={setValue}/>
                  )}
                </FormInput>
              </label>
              <input type="submit" value="Send" className="button" disabled={this.state.sending} />
            </form>
          )
        }}
      </Form>
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
          onChange={(v) => this.setState({nextState: v})}
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

  handleChanged(selectValue) {
    console.log('selection', selectValue);
    if (selectValue.length == 0) {
      this.props.onFilterChanged(() => true);
    } else {
      var values = _.map(selectValue, ({value}) => value);
      console.log(values);
      this.props.onFilterChanged(
        (d) => _.find(values, (v) => v == d));
    }
    this.setState({value: selectValue});
  }

  render() {
    return (
      <th>
        {this.props.column.label}
        <SignupStateSelect multi={true} onChange={this.handleChanged} value={this.state.value} />
      </th>
    );
  }
}

class ActionStore extends RowDataStore {
  reload(id) {
    return axios.get('/api/actions/'+id+'/')
      .then((results) => {
        titles.setTitle('Action Report', results.data.name);
        this.setData(results.data);
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
}

export default class ActionReport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showBulkStateEdit: false, columns: [], showEmailModal: false};
    this.handleFiltersChanged = this.handleFiltersChanged.bind(this);
    this.store = new ActionStore();
    this.store.on('update', () => this.updateColumns());
  }

  componentDidMount() {
    titles.setTitle('Action Report', '');
    this.reload();
  }

  reload() {
    this.store.reload(this.props.match.params.id);
  }

  handleFiltersChanged(filters) {
    this.setState({filters: filters});
  }

  updateColumns() {
    var columns = [
      {label: "Name",
       value: 'activist.name',
       cell: ({row}) => <span><Gravatar size={24} email={row.activist.email} />{row.activist.name}</span>},
      {label: "E-mail",
       value: 'activist.email'},
      {label: "Status",
       value: 'state',
       cell: ({row}) => <span>{row.state_name}</span>,
       header: SignupStateFilterHeader}
    ];
    _.each(this.store.data.fields, (f) => {
      columns.push({
        label: f.name,
        value: 'responses.'+f.id+'.value'
      });
    });
    this.setState({columns: columns});
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
        <Modal
          isOpen={this.state.showEmailModal}
          contentLabel="Email activists"
          onRequestClose={() => {this.setState({showEmailModal: false})}} >
          <StoreBinding store={this.store}>
            <EmailEditor action_id={this.props.match.params.id} onSent={() => {this.setState({showEmailModal: false});}}/>
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
                  <li><input type="button" className="button" value="Email" onClick={() => {this.setState({showEmailModal: true});}} /></li>
                  <li><input type="button" className="button" value="Refresh" onClick={() => this.reload()} /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="small-12 columns">
            <StoreBinding store={this.store}>
              <Table columns={this.state.columns} />
            </StoreBinding>
          </div>
        </div>
      </div>
    )
  }
}

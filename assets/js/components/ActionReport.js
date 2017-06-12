import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import _ from 'lodash'
import Modal from 'react-modal'
import { csrftoken } from '../Django'
import EventEmitter from 'events'
import RowDataStore from './RowDataStore'
import { withStore } from './StoreBinding'
import { Table } from './DataTable'
import { Form, Text, FormInput } from 'react-form'
import { MarkdownEditor } from 'react-markdown-editor'
import Gravatar from 'react-gravatar'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { Link } from 'react-router-dom'
import TextTruncate from 'react-text-truncate'
import Autocomplete from 'react-autocomplete'
import Switch from 'rc-switch'
import ModelIndex from './ModelIndex'
import { Signup, Form as APIForm } from '../API'
import { ModelDataStore } from './RowDataStore'

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

class ActivistAutocomplete extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      value: "",
      item: undefined
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(evt) {
    const q = evt.target.value;
    this.setState({value: q});
    axios.get('/api/activists/search/', {params: {q: q}})
      .then((response) => {
        this.setState({items: response.data.results});
      });
  }

  render() {
    return (
      <Autocomplete
        items={this.state.items}
        onChange={this.handleChange}
        value={this.state.value}
        getItemValue={(item) => item.name}
        renderItem={(item, isHighlighted) =>
          <div>{item.name} - {item.email}</div>
        }
        onSelect={(val, item) => {
          this.setState({value: item.name, selection: item});
          this.props.onSelected(item);
        }}
      />
    )
  }
}

const FormCards = withStore((props) => {
  const cards = _.map(props.store_data.visible, (row) => (
    <FormCard key={row.id} form={row} action_id={props.action_id} />
  ));
  return (
    <div>
      {cards}
      <div className="card form-card">
        <div className="card-divider">
          <h3><Link to={`/organize/action/${props.action_id}/form/new`}>Create a new form</Link></h3>
        </div>
        <div className="card-section">
          Create a new form to process signups and data for an action
        </div>
      </div>
      <br style={{clear:'both'}} />
    </div>
  )
});

class FormCard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.form.active,
    };
    this.doChange = this.doChange.bind(this);
  }

  doChange(checked) {
    const config = {
      headers: {'X-CSRFToken': csrftoken}
    };
    const data = {
      active: checked
    };
    axios.patch(`/api/forms/${this.props.form.id}/`, data, config)
      .then((response) => {
        this.setState({checked: response.data.active});
      });
  }

  render() {
    return (
      <div className="card form-card">
        <div className="card-divider">
          <h3><Link to={`/organize/action/${this.props.action_id}/form/${this.props.form.id}`}>{this.props.form.title}</Link></h3>
          <Switch onChange={this.doChange} checked={this.state.checked} checkedChildren="On" unCheckedChildren="Off"/>
        </div>
        <div className="card-section">
          <TextTruncate text={this.props.form.description} line={3} />
          <Link to={`/crm/f/${this.props.form.id}/`}><i className="fa fa-link" /> Public Link</Link>
        </div>
      </div>
    )
  }
}


class EmailEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sending: false,
      preview: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  updatePreview(contents) {
    var data = {
      subject: "Preview",
      body: contents,
      signups: _.map(this.props.store_data.selected, ({id}) => id)
    };
    axios.post('/api/actions/'+this.props.action_id+'/email_activists_preview/',
      data, {headers: {'X-CSRFToken': csrftoken}})
      .then((r) => {
        this.setState({preview: r.data.body});
      });
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
        this.props.onFinished();
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
                      onContentChange={(v) => {this.updatePreview(v);setValue(v);}}/>
                  )}
                </FormInput>
              </label>
              <input type="submit" value="Send" className="button" disabled={this.state.sending} />
              <pre>{this.state.preview}</pre>
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
        state: this.state.nextState.value
      };
      requests.push(axios.patch('/api/signups/'+row.id+'/', data, {headers: {'X-CSRFToken': csrftoken}}))
    });
    Promise.all(requests)
      .then(() => {
        this.setState({saving: false});
        this.props.onFinished();
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

class SignupStateFilterHeader extends React.PureComponent {
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

export default class ActionReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {columns: []};
    this.formStore = new ModelDataStore(APIForm, {action_id: this.props.match.params.id});
    this.signupStore = new ModelDataStore(Signup, {action_id: this.props.match.params.id});
    this.signupStore.on('update', () => this.updateColumns());
    this.reload();
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    this.signupStore.reload();
    this.formStore.reload();
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
    _.each(this.signupStore.data.fields, (f) => {
      columns.push({
        label: f.name,
        value: 'responses.'+f.id+'.value'
      });
    });
    this.setState({columns: columns});
  }

  onAddActivistSelected(item) {
    const data = {
      activist: item.url,
      responses: {},
      state: 0,
      action: this.signupStore.data.url
    };
    axios.post('/api/signups/', data, {headers: {'X-CSRFToken': csrftoken}})
      .then((response) => {
        this.reload();
      });
  }

  render() {
    // TODO: Add remove from action, send email buttons
    const actions = {
      bulkEditStates: {label: "Bulk edit states", component: BulkStateEditor},
      emailActivists: {label: "Email activists", component: (props) => <EmailEditor action_id={this.props.match.params.id} {...props} />},
    };
    return (
      <div>
        <div className="row">
          <div className="small-12 columns">
            <h3>Forms</h3>
            <FormCards store={this.formStore} action_id={this.props.match.params.id} />
            <h3>Activists</h3>
            <div className="top-bar">
              <div className="top-bar-left">
                <ul className="menu">
                  <li>
                    Add activist: <ActivistAutocomplete inputProps={{placeholder:"Add activist", type:"text"}} onSelected={(a) => this.onAddActivistSelected(a)}/>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <ModelIndex actions={actions} store={this.signupStore} columns={this.state.columns} />
      </div>
    )
  }
}

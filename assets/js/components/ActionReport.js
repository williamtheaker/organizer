import React from 'react'
import _ from 'lodash'
import { Form, Text, FormInput, NestedForm } from 'react-form'
import { MarkdownEditor } from 'react-markdown-editor'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { Link } from 'react-router-dom'
import TextTruncate from 'react-text-truncate'
import Autocomplete from 'react-autocomplete'
import Switch from 'rc-switch'
import { Action, } from '../API'
import { DropTarget } from 'react-dnd'
import AmpersandState from 'ampersand-state'
import { withState, FormCollection, ActivistCollection, Action as AmpersandAction, Signup, SignupCollection } from '../Model'
import { CSSTransitionGroup } from 'react-transition-group'
import ActivistCard from './ActivistCard'
import Spinner from './Spinner'
import Modal from 'react-modal'
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu'

class Collapsable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true
    }
  }

  childToRender() {
    if (this.state.collapsed) {
      return null
    } else {
      return this.props.children
    }
  }

  toggle() {
    this.setState({collapsed: !this.state.collapsed})
  }

  render() {
    return (
      <div>
        <h3>
          {this.props.title}
          <a onClick={() => this.toggle()}>
            <i className={"fa fa-" + (this.state.collapsed ? "plus" : "minus")}/>
          </a>
        </h3>
        {this.childToRender()}
      </div>
    )
  }
}

function SignupStateSelect(props) {
  const options = [
    {value: 'prospective', label: 'Prospective'},
    {value: 'confirmed', label: 'Confirmed'},
    {value: 'attended', label: 'Attended'},
    {value: 'noshow', label: 'No-Show'},
    {value: 'cancelled', label: 'Cancelled'}
  ];
  return (
    <Select options={options} {...props} />
  )
}

const collectTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver() && monitor.canDrop()
})

const columnSpec = {
  drop(props, monitor, component) {
    var {signup} = monitor.getItem();
    signup.save({state: props.state}, {patch: true});
    return {}
  },
  canDrop(props, monitor) {
    var {signup} = monitor.getItem();
    return signup.state != props.state;
  }
}

const ColumnTarget = withState(DropTarget("card", columnSpec, collectTarget)((props) => {
  const myRows = props.model[props.state];
  const cards = _.map(myRows, (row) => (
    <ActivistCard
      key={row.id}
      signup={row}
      onDragging={props.onDragging} />
  ))
  const selectAll = () => {
    _.each(myRows, r => r.set({selected: true}))
  }
  const selectNone = () => {
    _.each(myRows, r => r.set({selected: false}))
  }
  const spinner = props.model.loaded ? null : <Spinner />;
  return props.connectDropTarget((
    <div className={"target "+ (props.isOver ? "hover" : "")}>
      <ContextMenuTrigger id={props.state}>
        <ContextMenu id={props.state}>
          <MenuItem onClick={selectAll} >Select All</MenuItem> 
          <MenuItem onClick={selectNone} >Select None</MenuItem> 
        </ContextMenu>
        <h2>
          {props.name}
          <ContextMenuTrigger showOnClick={true} holdToDisplay={-1} renderTag='span' id={props.state}>
            <button className="options"><i className="fa fa-ellipsis-v" /></button>
          </ContextMenuTrigger>
        </h2>
        <div className="meta">
          <div>{cards.length}<p>cards</p></div>
          <div>{(cards.length / props.model.length)*100}%<p>of all cards</p></div>
        </div>
        <div className="add-activist">
          <ActivistAutocomplete inputProps={{placeholder:"Add activist", type:"text"}} onSelected={(a) => props.onAddActivistSelected(a)}/>
        </div>
        {spinner}
        <CSSTransitionGroup
          transitionName="appear"
          transitionEnterTimeout={200}
          transitionLeaveTimeout={200}>
          {cards}
        </CSSTransitionGroup>
      </ContextMenuTrigger>
    </div>
  ))
}))

class Column extends React.Component {
  onAddActivistSelected(item) {
    this.props.model.rows.create({
      activist: {id: item.id},
      state: this.props.state,
      action: this.props.model.action.url
    });
  }

  render() {
    return (
      <div className={"card-column card-column-"+this.props.state}>
        <ColumnTarget {...this.props} onAddActivistSelected={this.onAddActivistSelected.bind(this)}/>
      </div>
    )
  }
}

const SelectableSignup = Signup.extend({
  session: {
    'selected': 'boolean'
  }
})

const SelectableSignupCollection = SignupCollection.extend({
  model: SelectableSignup
})

const ConversionState = AmpersandState.extend({
  derived: {
    prospective: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "prospective")
      }
    },
    contacted: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "contacted")
      }
    },
    confirmed: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "confirmed")
      }
    },
    attended: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "attended")
      }
    },
    noshow: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "noshow")
      }
    },
    cancelled: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.state == "cancelled")
      }
    },
    selected: {
      deps: ['changeHash'],
      fn() {
        return this.rows.filter(r => r.selected)
      }
    }
  },
  session: {
    changeHash: ['number', false, 0],
    loaded: ['boolean', false, false],
  },
  children: {
    action: AmpersandAction,
  },
  collections: {
    rows: SelectableSignupCollection,
    forms: FormCollection
  },
  initialize() {
    this.rows.on('add remove change:state change', _.debounce(() => {
      this.changeHash += 1;
    }, 50));
    this.forms.on('add remove change', _.debounce(() => {
      this.changeHash += 1;
    }, 50));
  },
  update() {
    this.loaded = false;
    this.action.fetch();
    this.forms.fetch({data: {action_id: this.action.id}});
    this.rows.fetch({success: () => this.loaded=true, data: {action_id: this.action.id}});
  }
});

class ActivistConversionUIBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {dragging: false, showMore: false};
    this.onDragging = this.onDragging.bind(this);
  }

  onDragging(d) {
    this.setState({dragging: d});
  }

  showMore() {
    return this.state.dragging || this.state.showMore;
  }

  render() {
    /*const extraDrops = (
      <div className={"extra-drops " + (this.showMore() ? "show" : "hide")} >
        <a onClick={() => this.setState({showMore: !this.state.showMore})} >More...</a>
        <div className="container">
          <Column name="No-Show" state="noshow" model={this.props.model} />
          <Column name="Cancelled" state="cancelled" model={this.props.model} />
        </div>
      </div>
    )*/
    const extraDrops = null;
    return (
      <div className="conversion-ui">
        <Column name="Prospective" onDragging={this.onDragging} state="prospective" model={this.props.model}/>
        <Column name="Contacted" onDragging={this.onDragging} state="contacted" model={this.props.model} />
        <Column name="Confirmed" onDragging={this.onDragging} state="confirmed" model={this.props.model} />
        <Column name="Attended" onDragging={this.onDragging} state="attended" model={this.props.model} />
        {extraDrops}
      </div>
    )
  }
}

const ActivistConversionUI = withState(ActivistConversionUIBase);

class ActivistAutocomplete extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      results: [],
      value: "",
      item: undefined
    };

    this.activists = new ActivistCollection();
    this.activists.on('add delete change reset', this.updateResults.bind(this));
    this.handleChange = this.handleChange.bind(this);
    this.search = _.memoize(this.search.bind(this));
  }

  handleChange(evt) {
    const q = evt.target.value;
    this.setState({value: q});
    this.search(q);
    this.updateResults();
  }

  updateResults() {
    const needle = _.toLower(this.state.value);
    this.setState({results: this.activists.filter(a => _.toLower(a.name).includes(needle))});
  }

  search(q) {
    this.activists.fetch({data: {name__icontains: q}});
  }

  render() {
    return (
      <Autocomplete
        items={this.state.results}
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
        inputProps={this.props.inputProps}
      />
    )
  }
}

const FormCards = withState((props) => {
  const cards = _.map(props.model.forms.models, (row) => (
    <FormCard key={row.id} form={row} action={props.model.action} />
  ));
  const spinner = props.model.loaded ? null : <Spinner />;
  return (
    <div className="form-cards">
      {spinner}
      {cards}
      <div className="form-card">
        <h3><Link to={`/organize/action/${props.model.action.id}/form/new`}>Create a new form</Link></h3>
        Create a new form to process signups and data for an action
      </div>
      <br style={{clear:'both'}} />
    </div>
  )
});

class FormCardBase extends React.Component {
  constructor(props) {
    super(props);
    this.doChange = this.doChange.bind(this);
  }

  doChange(checked) {
    this.props.form.save({active: checked}, {patch: true});
  }

  render() {
    return (
      <div className="form-card">
        <h3><Link to={`/organize/action/${this.props.action.id}/form/${this.props.form.id}`}>{this.props.form.title}</Link></h3>
        <Switch onChange={this.doChange} checked={this.props.form.active} checkedChildren="On" unCheckedChildren="Off"/>
        <TextTruncate text={this.props.form.description} line={3} />
        <Link to={`/crm/f/${this.props.form.id}/`}><i className="fa fa-link" /> Public Link</Link>
      </div>
    )
  }
}

const FormCard = withState(FormCardBase);

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
    new Action({id: this.props.model.action.id})
      .email_activists_preview("Preview", contents, this.props.model.selected)
      .then((r) => {
        this.setState({preview: r.data.body});
      });
  }

  handleSubmit(values) {
    this.setState({sending: true});
    new Action({id: this.props.model.action.id})
      .email_activists(values.subject, values.body, this.props.model.selected)
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
      <Form onSubmit={this.handleSubmit}>
        {({submitForm}) => {
          return (
            <form method="post" onSubmit={submitForm}>
              <label>
                To:  {this.props.model.selected.length} activists
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

export default class ActionReport extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {showEmail: false};
    this.model = new ConversionState({
      action: {
        id: Number(this.props.match.params.id)
      }
    });
    this.model.update();
  }

  render() {
    // TODO: Add remove from action, send email buttons
    const actions = {
      emailActivists: {label: "Email selected activists", component: (props) => <EmailEditor action_id={this.props.match.params.id} {...props} />},
    };
    return (
      <div>
        <div className="row">
          <div className="small-12 columns">
            <Collapsable title="Forms">
              <FormCards model={this.model} />
            </Collapsable>
            <h3>Activists</h3>
          </div>
        </div>
        <Modal
          contentLabel="Email Activists"
          isOpen={this.state.showEmail}
          onRequestClose={() => this.setState({showEmail: false})}>
          <EmailEditor onFinished={() => this.setState({showEmail: false})} model={this.model} />
        </Modal>
        <button className="button" onClick={() => this.setState({showEmail: true})}>Email activists</button>
        <ActivistConversionUI model={this.model}/>
      </div>
    )
  }
}

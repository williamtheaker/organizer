import React from 'react'
import _ from 'lodash'
import { Form, Text, FormInput, NestedForm } from 'react-form'
import { MarkdownEditor } from 'react-markdown-editor'
import { Link } from 'react-router-dom'
import TextTruncate from 'react-text-truncate'
import Autocomplete from 'react-autocomplete'
import Switch from 'rc-switch'
import { DragDropContext, DropTarget } from 'react-dnd'
import AmpersandState from 'ampersand-state'
import { bindToState, withState, FormCollection, ActivistCollection, Action, Signup, SignupCollection } from '../Model'
import { DjangoModel } from '../ModelBase'
import { CSSTransitionGroup } from 'react-transition-group'
import SignupCard from './SignupCard'
import ActivistCard from './ActivistCard'
import Spinner from './Spinner'
import Modal from 'react-modal'
import DatePicker from 'react-datepicker'
import { TextField, RaisedButton, ListItem, List, Avatar, Divider, Paper, Card, CardHeader, CardText } from 'material-ui'
import HTML5Backend from 'react-dnd-html5-backend'

const collectTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver() && monitor.canDrop()
})

const columnSpec = {
  drop(props, monitor, component) {
    var {signup, activist} = monitor.getItem();
    if (signup) {
      signup.save({state: props.state}, {patch: true});
    } else if (activist) {
      props.model.rows.create({
        activist: {id: activist.id},
        state: props.state,
        action: props.model.action.url
      });
    }
    return {}
  },
  canDrop(props, monitor) {
    var {signup, activist} = monitor.getItem();
    if (signup) {
      return signup.state != props.state;
    } else if (activist) {
      return true;
    }
  }
}

const ColumnTarget = withState(DropTarget(["signup", "activist"], columnSpec, collectTarget)((props) => {
  const myRows = props.model[props.state];
  const cards = _.map(myRows, (row) => (
    <SignupCard
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
  const totalCards = props.model.rows.length;
  const pct = Math.round((totalCards == 0) ? "-" : ((cards.length / totalCards)*100))+"%"
  return props.connectDropTarget((
    <div className={"target "+ (props.isOver ? "hover" : "")}>
      <CardHeader subtitle={cards.length + " cards"}title={props.name} avatar={<Avatar>{pct}</Avatar>} />
      <div className="add-activist">
        <ActivistAutocomplete inputProps={{placeholder:"Add activist", type:"text"}} onSelected={(a) => props.onAddActivistSelected(a)}/>
      </div>
      {spinner}
      <CSSTransitionGroup
        transitionName="appear"
        transitionEnterTimeout={200}
        transitionLeaveTimeout={200}>
      <List>
        {cards}
      </List>
      </CSSTransitionGroup>
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
      <Card className={"card-column card-column-"+this.props.state}>
        <ColumnTarget {...this.props} onAddActivistSelected={this.onAddActivistSelected.bind(this)}/>
      </Card>
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
    action: Action,
  },
  collections: {
    rows: SelectableSignupCollection,
    suggestions: ActivistCollection,
    forms: FormCollection
  },
  initialize() {
    this.rows.on('add remove change:state change', _.debounce(() => {
      this.changeHash += 1;
      this.suggestions.fetch({uri: this.action.url + 'suggestions/'});
    }, 50));
    this.forms.on('add remove change', _.debounce(() => {
      this.changeHash += 1;
    }, 50));
  },
  update() {
    if (this.action.isNew()) {
      this.loaded = true;
    } else {
      this.loaded = false;
      this.action.fetch();
      this.suggestions.fetch({uri: this.action.url + 'suggestions/'});
      this.forms.fetch({data: {action_id: this.action.id}});
      this.rows.fetch({success: () => this.loaded=true, data: {action_id: this.action.id}});
    }
  }
});

class ActivistConversionUIBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {dragging: false, showMore: false};
    this.onDragging = this.onDragging.bind(this);
    this.props.model.suggestions.on('change add reset', () => this.forceUpdate());
  }

  onDragging(d) {
    this.setState({dragging: d});
  }

  showMore() {
    return this.state.dragging || this.state.showMore;
  }

  render() {
    var suggestions = null;
    if (!this.props.model.loaded) {
      suggestions = <Spinner />
    } else if (this.props.model.suggestions.length == 0) {
      suggestions = <p><em>Add some activists below to see suggestions</em></p>
    } else {
      suggestions = this.props.model.suggestions.map(f => (
        <ActivistCard activist={f} key={f.cid} />
      ));
    }
    return (
      <div className="conversion-ui">
        <div className="suggestions">
          <h2>Suggestions</h2>
          <div className="card-list">
            {suggestions}
          </div>
        </div>
        <p />
        <Divider />
        <p />
        <div className="card-columns">
          <Column name="Prospective" onDragging={this.onDragging} state="prospective" model={this.props.model}/>
          <Column name="Contacted" onDragging={this.onDragging} state="contacted" model={this.props.model} />
          <Column name="Confirmed" onDragging={this.onDragging} state="confirmed" model={this.props.model} />
          <Column name="Attended" onDragging={this.onDragging} state="attended" model={this.props.model} />
        </div>
      </div>
    )
  }
}

const ActivistConversionUI = DragDropContext(HTML5Backend)(withState(ActivistConversionUIBase));

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

const EmailPreview = DjangoModel.extend({
  props: {
    body: 'string',
    subject: 'string',
    signups: 'array',
    action: 'state'
  },
  derived: {
    url: {
      deps: ['action.url'],
      fn() {
        return this.action.url+'email_activists_preview/'
      }
    }
  }
})

const Email = EmailPreview.extend({
  props: {
    body: 'string',
    subject: 'string',
    signups: 'array',
    action: 'state'
  },
  derived: {
    url: {
      deps: ['action.url'],
      fn() {
        return this.action.url+'email_activists/'
      }
    }
  }
})

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
    const data = {
      subject: 'Preview',
      body: contents,
      signups: _.map(this.props.model.selected, ({id}) => id),
      action: this.props.model.action
    };
    const preview = new EmailPreview(data)
    return preview.save()
      .then((r) => r.json())
      .then((json) => {
        this.setState({preview: json.body});
      });
  }

  handleSubmit(values) {
    this.setState({sending: true});
    const data = {
      subject: values.subject,
      body: values.body,
      signups: _.map(this.props.model.selected, ({id}) => id),
      action: this.props.model.action
    };
    const mail = new Email(data)
    return mail.save()
      .then((r) => r.json())
      .then((json) => {
        this.setState({sending: false})
        this.props.onFinished();
      })
      .catch(() => {
        this.setState({sending: false})
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
    const isNew = this.props.match.params.id == "new"
    const actionData = isNew ? {} : {id: Number(this.props.match.params.id)}
    this.model = new ConversionState({
      action: actionData
    });
    this.model.update();
  }

  componentDidMount() {
    this.model.on('change:loaded', () => this.forceUpdate());
    this.model.action.on('change:name change:date', () => this.forceUpdate());
  }

  render() {
    const formLinks = _.map(this.model.action.forms, f => (
      <ListItem key={f.cid}>
        <Link to={`/action/${this.model.action.slug}/${f.id}/`}>
          <i className="fa fa-link" />
          {f.title}
        </Link>
      </ListItem>
    ));
    return (
      <div className="action-report">
        <div className="row">
          <div className="small-8 columns">
            <h2>
              <TextField
                fullWidth={true}
                floatingLabelText="Title"
                disabled={!this.model.loaded}
                onBlur={(evt) => this.model.action.save({name: evt.target.value}, {patch: true})}
                value={this.model.action.name}
                onChange={(evt) => this.model.action.set({name: evt.target.value})} />
            </h2>
          </div>
          <div className="small-4 columns">
            <Paper>
              <List>
                <ListItem>
                  Date:
                  <DatePicker
                    selected={this.model.action.date}
                    onChange={(date) => this.model.action.save({date: date}, {patch: true})}/>
                </ListItem>
                {formLinks}
                <ListItem>
                  <Link
                    to={`/organize/action/${this.model.action.id}/form/new`}>
                    Create a new form
                  </Link>
                </ListItem>
              </List>
            </Paper>
          </div>
        </div>
        <Modal
          contentLabel="Email Activists"
          isOpen={this.state.showEmail}
          onRequestClose={() => this.setState({showEmail: false})}>
          <EmailEditor onFinished={() => this.setState({showEmail: false})} model={this.model} />
        </Modal>
        <RaisedButton
          label="Email selected activists"
          onClick={() => this.setState({showEmail: true})}
          primary={true} />
        <p />
        <ActivistConversionUI model={this.model}/>
      </div>
    )
  }
}

import React from 'react'
import { Form, Text, NestedForm, FormInput } from 'react-form'
import PlacesAutocomplete from 'react-places-autocomplete'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import moment from 'moment'
import AddToCalendar from 'react-add-to-calendar'
import { RaisedButton, Divider, Card, CardHeader, Paper } from 'material-ui'
import { withState, bindToState, Action, Submission } from '../Model'
import Header from './Header'

const HappyHouse = () => (
  <div className="doodle">
    <span className="spinner"><span><span><span>
    </span></span></span></span>
    <p>🏠</p>
  </div>
);

export const Thanks = (props) => (
  <div className="expanded row the-form">
    <div className="small-12 columns medium-7 medium-offset-1 the-response">
      <h1>Thanks!</h1>
      <HappyHouse />
      <p>Your response has been recorded.</p>
      <p><a onClick={() => {props.onSubmitAnother()}}>Submit another</a></p>
      <div className="name">{props.action.name}</div>
      <div className="date">{props.action.date.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.asEvent}/>
      <div className="until">{props.action.date.fromNow()}</div>
    </div>
  </div>
);

export const PlacesAutocompleteField = (props) => (
  <FormInput {...props}>
    {({ setValue, getValue, setTouched }) => {
      const inputProps = {
        value: getValue(),
        onChange: val => setValue(val),
        onBlur: () => setTouched()
      }
      return (
        <PlacesAutocomplete inputProps={inputProps} />
      )
    }}
  </FormInput>
)

export class SignupForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverError: ''
    }
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(values, state, props, theForm) {
    Raven.captureBreadcrumb({
      message: "Form submitted",
      category: 'action',
      data: values
    });
    const submissionData = {
      ...values,
      action: this.props.action
    }
    const submission = new Submission(submissionData);
    this.setState({serverError: ''});
    submission.save()
      .then(this.props.onSubmit)
      .catch((err) => {
        const massagedErrors = _.mapValues(submission.errors, v => v.join(' '))
        theForm.setAllTouched(true, {errors: massagedErrors});
        if (err.response && err.response.status != 400) {
          this.setState({serverError: "Recieved "+err.response.status+" from server. Try again."});
        } else {
          return Promise.reject(err);
        }
    })
  }

  render() {
    return (
      <Form defaultValues={{email: ''}} onSubmit={this.handleSubmit}>
        {({submitForm }) => (
          <form method="post" onSubmit={submitForm}>
            <p className="error">{this.state.serverError}</p>
            <label>Email <span className="required">*</span><Text type='text' field='email' /></label>
            <label>Name <Text type='text' field='name' /></label>
            <label>
              Address
              <PlacesAutocompleteField field="address" />
            </label>
            <RaisedButton label="Submit" fullWidth={true} primary={true} labelPosition="before" containerElement="label">
              <button type="submit" />
            </RaisedButton>
          </form>
        )}
      </Form>
    )
  }
}

export const FormInputView = withState((props) => (
  <Paper zDepth={2} className="expanded row the-form">
    <Card className="small-12 columns medium-7 medium-offset-1 the-ask">
      <h1>{props.action.name}</h1>
      <div className="body">
        <ReactMarkdown source={props.action.description || ""} />
      </div>
      <Divider />
      <SignupForm onSubmit={props.onSubmit} action={props.action} />
    </Card>
    <Paper zDepth={2} className="medium-3 columns meta">
      <div className="name">{props.action.name}</div>
      <div className="date">{props.action.date.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.eventDescription}/>
      <div className="until">{props.action.date.fromNow()}</div>
    </Paper>
  </Paper>
))

export default class FormView extends React.PureComponent {
  constructor(props) {
    super(props);
    const urlID = props.match.params.id;
    const numericID = Number(_.last(urlID.split('-')))
    const actionData = {id: numericID};
    this.action = new Action(actionData);
    this.action.sideloadOrFetch({success: () => {
      Raven.captureBreadcrumb({
        message: 'Form loaded via http',
        category: 'action',
        data: this.action
      });
      this.setState({loading: false});
    }});

    bindToState(this, this.action, {
      name: 'name',
      description: 'description',
      date: 'date'
    });

    this.state = {
      submitted: false,
      loading: !this.action.sideloaded,
    };
  }

  render() {
    if (this.state.loading) {
      return <Spinner />
    } else {
      const asEvent = {
        title: this.state.name,
        location: '',
        description:this.state.description,
        startTime: this.action.date.format(),
        endTime: this.action.date.add('2 hour').format()
      };
      if (this.state.submitted) {
        return (
          <Thanks
            asEvent={asEvent}
            action={this.action}
            onSubmitAnother={() => this.setState({submitted: false})} />
        )
      } else {
        return (
          <div>
            <Header />
            <FormInputView
              action={this.action}
              eventDescription={asEvent}
              onSubmit={() => this.setState({submitted: true})}
            />
          </div>
        )
      }
    }
  }
}

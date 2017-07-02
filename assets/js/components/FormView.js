import React from 'react'
import { titles } from '../TitleManager'
import { Form, Text, NestedForm, FormInput } from 'react-form'
import PlacesAutocomplete from 'react-places-autocomplete'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import moment from 'moment'
import AddToCalendar from 'react-add-to-calendar'
import { RaisedButton, Divider, Card, CardHeader, Paper } from 'material-ui'
import { bindToState, Form as ModelForm, Submission, SubmissionField } from '../Model'
import Header from './Header'

import FormFieldForm from './FormFieldForm'

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
      <div className="name">{props.form.action.name}</div>
      <div className="date">{props.form.action.date.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.asEvent}/>
      <div className="until">{props.form.action.date.fromNow()}</div>
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
    const fieldValues = _.map(_.keys(values.fields), fieldID => (
      new SubmissionField({id: fieldID, value: values.fields[fieldID]})
    ));
    const submissionData = {
      ...values,
      fields: fieldValues,
      form: this.props.form
    }
    const submission = new Submission(submissionData);
    this.setState({serverError: ''});
    submission.save()
      .then(this.props.onSubmit)
      .catch((err) => {
        const massagedErrors = _.mapValues(submission.errors, v => v.join(' '))
        theForm.setAllTouched(true, {errors: massagedErrors});
        this.setState({serverError: "Recieved "+err.response.status+" from server. Try again."});
    })
  }

  render() {
    return (
      <Form onSubmit={this.handleSubmit}>
        {({submitForm }) => (
          <form method="post" onSubmit={submitForm}>
            <p className="error">{this.state.serverError}</p>
            <label>Email <span className="required">*</span><Text type='text' field='email' /></label>
            <label>Name <Text type='text' field='name' /></label>
            <label>
              Address
              <PlacesAutocompleteField field="address" />
            </label>
            <NestedForm field='fields'>
              <FormFieldForm fields={this.props.fields} />
            </NestedForm>
            <RaisedButton label="Submit" fullWidth={true} primary={true} labelPosition="before" containerElement="label">
              <button type="submit" />
            </RaisedButton>
          </form>
        )}
      </Form>
    )
  }
}

export const FormInputView = (props) => (
  <Paper zDepth={2} className="expanded row the-form">
    <Card className="small-12 columns medium-7 medium-offset-1 the-ask">
      <h1>{props.form.title}</h1>
      <div className="body">
        <ReactMarkdown source={props.form.description} />
      </div>
      <Divider />
      <SignupForm onSubmit={props.onSubmit} form={props.form} fields={props.form.fields} />
    </Card>
    <Paper zDepth={2} className="medium-3 columns meta">
      <div className="name">{props.form.action.name}</div>
      <div className="date">{props.form.action.date.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.eventDescription}/>
      <div className="until">{props.form.action.date.fromNow()}</div>
    </Paper>
  </Paper>
)

export default class FormView extends React.PureComponent {
  constructor(props) {
    super(props);

    const formData = {id: Number(props.match.params.id)};
    this.form = new ModelForm(formData);
    this.form.sideloadOrFetch({success: () => {
      Raven.captureBreadcrumb({
        message: 'Form loaded via http',
        category: 'action',
        data: this.form
      });
      this.setState({loading: false});
    }});

    bindToState(this, this.form, {
      title: 'title',
      description: 'description',
      fields: 'fields',
      action: 'action'
    });

    this.state = {
      submitted: false,
      loading: !this.form.sideloaded,
      action: this.form.action
    };
  }

  render() {
    if (this.state.loading) {
      return <Spinner />
    } else {
      const asEvent = {
        title: this.state.action.name,
        location: '',
        description:this.state.description,
        startTime: this.state.action.date.format(),
        endTime: this.state.action.date.add('2 hour').format()
      };
      if (this.state.submitted) {
        return (
          <Thanks
            asEvent={asEvent}
            form={this.form}
            onSubmitAnother={() => this.setState({submitted: false})} />
        )
      } else {
        return (
          <div>
            <Header />
            <FormInputView
              form={this.form}
              eventDescription={asEvent}
              onSubmit={() => this.setState({submitted: true})}
            />
          </div>
        )
      }
    }
  }
}

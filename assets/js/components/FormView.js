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
      <div className="date">{props.asMoment.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.asEvent}/>
      <div className="until">{props.asMoment.fromNow()}</div>
    </div>
  </div>
);

export const SignupForm = (props) => (
  <form method="post" onSubmit={props.submitForm}>
    <label>Email <span className="required">*</span><Text type='text' field='email' /></label>
    <label>Name <span className="required">*</span><Text type='text' field='name' /></label>
    <label>
      Address
      <FormInput field='address'>
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
    </label>
    <NestedForm field='fields'>
      <FormFieldForm fields={props.fields} />
    </NestedForm>
    <RaisedButton label="Submit" fullWidth={true} primary={true} labelPosition="before" containerElement="label">
      <button type="submit" />
    </RaisedButton>
  </form>
)

export const FormInputView = (props) => (
  <Paper zDepth={2} className="expanded row the-form">
    <Card className="small-12 columns medium-7 medium-offset-1 the-ask">
      <h1>{props.form.title}</h1>
      <div className="body">
        <ReactMarkdown source={props.form.description} />
      </div>
      <Divider />
      <p className="error">{props.serverError}</p>
      <Form onSubmit={props.onSubmit} >
        {({ submitForm, setAllTouched}) => {
          return (
            <SignupForm submitForm={submitForm} fields={props.form.fields} />
          )
        }}
      </Form>
    </Card>
    <Paper zDepth={2} className="medium-3 columns meta">
      <div className="name">{props.form.action.name}</div>
      <div className="date">{props.dateAsMoment.format('MMMM Do YYYY, h:mm:ss a')}</div>
      <AddToCalendar event={props.eventDescription}/>
      <div className="until">{props.dateAsMoment.fromNow()}</div>
    </Paper>
  </Paper>
)

export default class FormView extends React.PureComponent {
  constructor(props) {
    super(props);

    const hasInline = (typeof INLINE_FORM_DATA != 'undefined');
    const formData = (hasInline ? INLINE_FORM_DATA : {id: Number(props.match.params.id)});
    if (hasInline) {
      Raven.captureBreadcrumb({
        message: 'Form loaded from sideload cache',
        category: 'action',
        data: formData,
      });
    }
    this.form = new ModelForm(formData);
    console.log('new form', this.form);

    bindToState(this, this.form, {
      title: 'title',
      description: 'description',
      fields: 'fields',
      action: 'action'
    });

    this.state = {
      submitted: false,
      loading: !hasInline,
      serverError: undefined,
      action: this.form.action
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const hasInline = (typeof INLINE_FORM_DATA != 'undefined');
    if (!hasInline) {
      this.form.fetch({success: () => {
        Raven.captureBreadcrumb({
          message: 'Form loaded via http',
          category: 'action',
          data: this.form
        });
        this.setState({loading: false});
      }});
    }
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
      name: values.name,
      email: values.email,
      address: values.address,
      fields: fieldValues,
      form: this.form
    }
    const submission = new Submission(submissionData);
    this.setState({serverError: ''});
    submission.save({}, {success: () => {
      this.setState({submitted: true});
    }, error: (model, response) => {
      if (response.statusCode == 400) {
        var errors = {};
        _.each(
          response.body.errors,
          (value, key) => {
             errors[key] = value.join(' ');
          }
        );
        theForm.setAllTouched(true, {errors: errors});
      } else {
        this.setState({serverError: "Recieved "+response.statusCode+" from server. Try again."});
        Raven.captureException(response);
      }
    }});
  }

  render() {
    if (this.state.loading) {
      return <Spinner />
    } else {
      const asMoment = moment(this.state.action.date);
      const asEvent = {
        title: this.state.action.name,
        location: '',
        description:this.state.description,
        startTime: asMoment.format(),
        endTime: asMoment.add('2 hour').format()
      };
      if (this.state.submitted) {
        return (
          <Thanks
            asMoment={asMoment}
            asEvent={asEvent}
            form={this.form}
            onSubmitAnother={() => this.setState({submitted: false})} />
        )
      } else {
        return (
          <FormInputView
            form={this.form}
            dateAsMoment={asMoment}
            eventDescription={asEvent}
            onSubmit={this.handleSubmit}
            serverError={this.state.serverError}
          />
        )
      }
    }
  }
}

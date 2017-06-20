import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import { Form, Text, NestedForm, FormInput } from 'react-form'
import PlacesAutocomplete from 'react-places-autocomplete'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import { csrftoken } from '../Django'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import moment from 'moment'
import AddToCalendar from 'react-add-to-calendar'

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
    <input type="submit" className="button" value="Submit" />
  </form>
)

export default class FormView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        id: 0,
        title: '',
        description: '',
        fields: []
      },
      submitted: false,
      loading: true,
      serverError: undefined
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    this.setState({form: {id:0, title: '', description: '', fields: []}, submitted: false, loading: true});
    if (typeof INLINE_FORM_DATA != "undefined") {
      Raven.captureBreadcrumb({
        message: 'Form loaded from cache',
        category: 'action',
        data: INLINE_FORM_DATA
      });
      this.setState({form: INLINE_FORM_DATA, loading: false});
      //titles.setTitle(INLINE_FORM_DATA.action.name, '');
    } else {
      axios.get('/api/forms/'+this.props.match.params.id+'/')
        .then((results) => {
          Raven.captureBreadcrumb({
            message: 'Form loaded',
            category: 'action',
            data: results.data
          });
          this.setState({form: results.data, loading: false});
          //titles.setTitle(results.data.action.name, '');
        });
    }
  }

  handleSubmit(values) {
    Raven.captureBreadcrumb({
      message: "Form submitted",
      category: 'action',
      data: values
    });
    var data = {
      name: values.name,
      email: values.email,
      address: values.address
    };
    for(var fieldID in values.fields) {
      if (fieldID) {
        data['input_'+fieldID] = values.fields[fieldID];
      }
    }
    axios.post('/api/forms/'+this.props.match.params.id+'/submit_response/',
      data, {headers: {'X-CSRFToken': csrftoken}})
      .then((r) => {
        this.setState({submitted: true});
      })
      .catch((error) => {
        if (error.response.status == 400) {
          var errors = {};
          _.each(
            error.response.data.errors,
            (value, key) => {
               errors[key] = value.join(' ');
            }
          );
          this._form.setAllTouched(true, {errors: errors});
        } else {
          this.setState({serverError: "Recieved "+error.response.status+" from server. Try again."});
          Raven.captureException(error);
        }
      });
  }

  render() {
    if (this.state.submitted) {
      const asMoment = moment(this.state.form.action.date);
      const asEvent = {
        title: this.state.form.action.name,
        location: '',
        description:this.state.form.description,
        startTime: asMoment.format(),
        endTime: asMoment.add('2 hour').format()
      };
      return (
        <Thanks asMoment={asMoment} asEvent={asEvent} form={this.state.form} onSubmitAnother={this.reload.bind(this)} />
      )
    } else if (this.state.loading) {
      return (
        <Spinner />
      )
    } else {
      const asMoment = moment(this.state.form.action.date);
      const asEvent = {
        title: this.state.form.action.name,
        location: '',
        description:this.state.form.description,
        startTime: asMoment.format(),
        endTime: asMoment.add('2 hour').format()
      };
      return (
        <div className="expanded row the-form">
          <div className="small-12 columns medium-7 medium-offset-1 the-ask">
            <h1>{this.state.form.title}</h1>
            <div className="body">
              <ReactMarkdown source={this.state.form.description} />
            </div>
            <p className="error">{this.state.serverError}</p>
            <Form ref={(r) => {this._form = r}} onSubmit={this.handleSubmit} >
              {({ submitForm, setAllTouched}) => {
                this.setAllTouched = setAllTouched;
                return (
                  <SignupForm submitForm={submitForm} fields={this.state.form.fields} />
                )
              }}
            </Form>
          </div>
          <div className="medium-3 columns meta">
            <div className="name">{this.state.form.action.name}</div>
            <div className="date">{asMoment.format('MMMM Do YYYY, h:mm:ss a')}</div>
            <AddToCalendar event={asEvent}/>
            <div className="until">{asMoment.fromNow()}</div>
          </div>
        </div>
      )
    }
  }
}

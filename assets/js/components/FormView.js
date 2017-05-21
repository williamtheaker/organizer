import React from 'react'
import axios from 'axios'
import { titles } from '../TitleManager'
import { Form, Text, NestedForm } from 'react-form'
import _ from 'underscore'

import FormFieldForm from './FormFieldForm'

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


export default class FormView extends React.Component {
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
      serverError: undefined
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.csrftoken = getCookie('csrftoken');
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    this.setState({form: {id:0, title: '', description: '', fields: []}, submitted: false});
    axios.get('/api/forms/'+this.props.match.params.id+'/')
      .then((results) => {
        console.log(results);
        this.setState({form: results.data});
        titles.setTitle(results.data.action.name, results.data.title);
      });
  }

  handleSubmit(values) {
    console.log('submit!', values);
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
      data, {headers: {'X-CSRFToken': this.csrftoken}})
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
        }
      });
  }

  render() {
    if (this.state.submitted) {
      return (
        <div>
          <p>Thanks! Your response has been recorded.</p>
          <p><a onClick={() => {this.reload()}}>Submit another</a></p>
        </div>
      )
    } else {
      return (
        <div>
          <p>{this.state.form.title}</p>
          <p>{this.state.form.description}</p>
          <p className="error">{this.state.serverError}</p>
          <Form ref={(r) => {this._form = r}} onSubmit={this.handleSubmit} >
            {({ submitForm, setAllTouched}) => {
              this.setAllTouched = setAllTouched;
              return (
                <form method="post" onSubmit={submitForm}>
                  <label>Email <Text type='text' field='email' /></label>
                  <label>Name <Text type='text' field='name' /></label>
                  <label>Address <Text type='text' field='address' /></label>
                  <NestedForm field='fields'>
                    <FormFieldForm fields={this.state.form.fields} />
                  </NestedForm>
                  <input type="submit" className="button" value="Submit" />
                </form>
              )
            }}
          </Form>
        </div>
      )
    }
  }
}



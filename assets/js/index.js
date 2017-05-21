import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { titles } from './TitleManager'
import { Form, Text, Checkbox, NestedForm } from 'react-form'
import _ from 'underscore'

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
var csrftoken = getCookie('csrftoken');

class Footer extends React.Component {
  render() {
    return (
      <footer>
        <div className="row">
          <div className="small-12 columns">
            Made with love in Oakland, CA
          </div>
        </div>
      </footer>
    )
  }
}

class Canvas extends React.Component {
  render() {
    return (
      <div className="row canvas">
        <div className="small-12 columns">
          {this.props.children}
        </div>
      </div>
    )
  }
}

class Header extends React.Component {
  render() {
    return (
      <header className="row">
        <div className="small-10 columns mastiff">
          <h1>{this.props.title}</h1>
          <h2>{this.props.subtitle}</h2>
        </div>
        <div className="small-2 columns logo">
          <Link to="/">East Bay Forward</Link>
        </div>
      </header>
    )
  }
}

class Home extends React.Component {
  render() {
    return (
      <Link to="/actions">Actions</Link>
    )
  }
}

class FormView extends React.Component {
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
          this._form.setState({errors: errors});
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
      var inputs = [];
      $(this.state.form.fields).each((idx, field) => {
        var element;
        switch (field.control_type) {
          case 0: // text
            element = (<Text field={field.id} />);
            break;
          case 1: // boolean
            element = (<Checkbox value='true' field={field.id} />);
            break;
          case 2: // multiple choice
          case 3: // options
            var options = _.map(
              field.control_data.split("\n"),
              (line) => {
                return {label: line, value: line};
              }
            );
            element = (<Select field={field.id} options={options} />);
        }
        inputs.push((
          <label key={field.name}>{field.name} {element}</label>
        ));
      });
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
                    <Form>
                      {inputs}
                    </Form>
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

class ActionList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actions: []
    };
  }

  componentDidMount() {
    axios.get('/api/actions')
      .then((d) => {
        this.setState({actions: d.data.results});
      });
  }

  render() {
    var actionList = [];
    $(this.state.actions).each((idx, a) => {
      actionList.push((<tr key={a.id}><td>{a.name}</td></tr>));
    });
    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {actionList}
        </tbody>
      </table>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      subtitle: ''
    }
    titles.register(() => {
      this.setState({title: titles.title, subtitle: titles.subtitle});
    });
  }

  render() {
    return (
      <Router>
        <div>
          <div className="row">
            <div className="small-12 columns">
              <Header title={this.state.title} subtitle={this.state.subtitle} />
              <Canvas>
                <Route exact path="/" component={Home}/>
                <Route exact path="/crm/f/:id" component={FormView}/>
              </Canvas>
            </div>
          </div>
          <Footer />
        </div>
      </Router>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('container'))

import React from 'react'
import ReactDOM from 'react-dom'
import app_css from '../scss/app.scss'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { titles } from './TitleManager'

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
      submitted: false
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

  handleSubmit(event) {
    event.preventDefault();
    var data = {}
    $(event.target.elements).each((idx, field) => {
      data[field.name] = field.value;
    });
    axios.post('/api/forms/'+this.props.match.params.id+'/submit_response/',
      data,
        {headers: {'X-CSRFToken': csrftoken}})
      .then((r) => {
        this.setState({submitted: true});
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
            element = (<input type="text" name={"input_"+field.id} />);
            break;
          case 1: // boolean
            element = (<input type="checkbox" name={"input_"+field.id} />);
            break;
          case 2: // multiple choice
          case 3: // options
        }
        inputs.push((
          <label key={field.name}>{field.name} {element}</label>
        ));
      });
      return (
        <div>
          <p>{this.state.form.title}</p>
          <p>{this.state.form.description}</p>
          <form method="post" onSubmit={this.handleSubmit}>
            <label>Email <input type="text" name="email" /></label>
            <label>Name <input type="text" name="name" /></label>
            <label>Address <input type="text" name="address" /></label>
            {inputs}
            <p>
              <input type="submit" className="button" value="Submit"/ >
            </p>
          </form>
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

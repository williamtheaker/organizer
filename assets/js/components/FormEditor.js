import React from 'react'
import RichTextEditor from 'react-rte'
import axios from 'axios'
import _ from 'lodash'
import Select from 'react-select'
import { Form, Text, NestedForm, FormInput, Checkbox } from 'react-form'
import {csrftoken} from '../Django'

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

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: RichTextEditor.createEmptyValue(),
      rendered: ''
    }
    this.onChange = this.onChange.bind(this);
  }

  onChange(v) {
    this.setState(prevState => {
      value: v
    });
    this.setState(prevState => {
      const rendered = prevState.value.toString('markdown');
      this.props.onChange(rendered);
      return {rendered: rendered};
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value != nextProps.value) {
      this.setState({value: RichTextEditor.createValueFromString(nextProps.value, 'markdown')});
    }
  }

  render() {
    return <RichTextEditor
      onChange={this.onChange}
      value={this.state.value}
    />
  }
}

const FieldControl = (props) => {
  const {control_type, ...newProps} = props;
  switch(control_type) {
    case 0:
      return <Text type="text" {...newProps} />
    case 1:
      return <Checkbox type="checkbox" {...newProps} />
    default:
      return <div>Bad control type: {control_type}</div>
  }
}

const FieldNameEditor = (props) => (
  <Text placeholder="Enter a question" className="inline-editor" field="name" type="text" {...props} />
)

const FieldTypeEditor = (props) => {
    const types = [
      {value: 0, label: 'Text'},
      {value: 1, label: 'Checkbox'},
      // TODO: implement these two
      /*{value: 2, label: 'Select Multiple'},
      {value: 3, label: 'Select One'}*/
    ]
    return (
      <Select {...props} clearable={false} options={types}/>
    )
}

const EditorFields = (props) => (
  <div className="editor-fields">
    {_.map(props.values.fields, (field, i) => (
    <div key={i} className="editor-field">
      <div className="row">
        <div className="small-1 columns">
          <button onClick={() => props.removeValue('fields', i)} className="button"><i className="fa fa-times"/></button>
        </div>
        <div className="small-8 columns">
          <Text className="inline-editor" field={['fields', i, 'name']} type="text" />
        </div>
        <div className="small-3 columns">
          <FormInput field={['fields', i, 'control_type']}>
            {({setValue, getValue}) => 
              <FieldTypeEditor 
                value={getValue()}
                onChange={(v) => setValue(v.value)} />
            }
          </FormInput>
        </div>
      </div>
      <div className="row">
        <div className="small-12 columns">
          <FieldControl disabled control_type={field.control_type}/>
        </div>
      </div>
    </div>))}
  </div>
)

export default class FormEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        description: '',
        fields: []
      },
      loading: true
    }

    this.doSubmit = this.doSubmit.bind(this);
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    axios.get('/api/actions/'+this.props.match.params.action_id+'/')
      .then((results) => {
        this.setState({action: results.data});
      });
    if (this.props.match.params.id == "new") {
      this.setState({loading: false});
    } else {
      axios.get('/api/forms/'+this.props.match.params.id+'/')
        .then((results) => {
          this.setState({form: results.data, loading: false});
        });
    }
  }

  doSubmit(values) {
    const config = {headers: {'X-CSRFToken': csrftoken}};
    if (this.props.match.params.id == 'new') {
      const data = {
        action: this.state.action.url,
        title: values.title,
        //fields: values.fields,
        description: values.description.toString('markdown'),
        next_state: values.next_state
      }
      axios.post('/api/forms/', data, config)
        .then((response) => {
          console.log('New form:', response);
          return response.data;
        })
        .then((form) => {
          return Promise.all(_.map(values.fields, (f) => {
            const data = {
              name: f.name,
              control_type: f.control_type,
              form: form.url
            };
            return axios.post('/api/fields/', data, config);
          }));
        })
        .then(() => {
          this.reload();
        });
    } else {
      const deletedFields = _.filter(
        this.state.form.fields,
        (field) => _.find(
          values.fields, 
          (value) => value.id == field.id
        ) === undefined
      );

      const requests = [..._.map(values.fields, (f) => {
        const data = {
          control_type: f.control_type,
          name: f.name
        }
        if (f.hasOwnProperty('id')) {
          return axios.patch('/api/fields/'+f.id+'/', data, config);
        } else {
          const createData = {
            form: this.state.form.url,
            ...data
          }
          return axios.post('/api/fields/', createData, config);
        }
      }), _.map(deletedFields, (f) => {
        return axios.delete('/api/fields/'+f.id+'/', config);
      }), (() => {
        const data = {
          description: values.description.toString('markdown'),
          title: values.title
        }
        return axios.patch('/api/forms/'+this.state.form.id+'/', data, config);
      })()];
      Promise.all(requests)
        .then(() => {
          this.reload()
        });
    }
  }

  render() {
    if (!this.state.loading) {
      const defaults = {
        title: this.state.form.title,
        description: RichTextEditor.createValueFromString(this.state.form.description, 'markdown'),
        fields: _.map(this.state.form.fields, (field) => ({
          name: field.name,
          control_type: field.control_type,
          id: field.id
        }))
      }
      return (
        <Form onSubmit={this.doSubmit} defaultValues={defaults}>
          {({ submitForm, addValue, removeValue, values }) => (
            <form onSubmit={submitForm}>
              <div className="row">
                <div className="small-12 columns">
                  <label className="floating"><dt>Title</dt>
                    <Text placeholder="Name this form" className="inline-editor title" field="title" type="text" />
                  </label>
                </div>
              </div>
              <div className="row">
                <div className="small-12 columns">
                  <FormInput field="description">
                    {({setValue, getValue}) => (
                      <RichTextEditor value={getValue()} onChange={v => setValue(v)} />
                    )}
                  </FormInput>
                </div>
              </div>
              <EditorFields values={values} removeValue={removeValue} />
              <div className="row">
                <div className="small-7 columns">
                  <button type="button" onClick={() => addValue('fields', {control_type: 0, name: ''})} className="button"><i className="fa fa-plus" /> Add field</button>
                </div>
                <div className="small-5 columns">
                  After submitting, mark activists as:
                  <FormInput field="next_state">
                    {({getValue, setValue}) => 
                      <SignupStateSelect value={getValue()} onChange={v => setValue(v.value)} clearable={false} />
                    }
                  </FormInput>
                </div>
              </div>
              <div className="row">
                <div className="small-12 columns">
                  <button type="submit" className="button">Save</button>
                </div>
              </div>
            </form>
          )}
        </Form>
      )
    } else {
      return <p>Loading</p>
    }
  }
}
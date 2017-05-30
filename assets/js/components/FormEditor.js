import React from 'react'
import { MarkdownEditor } from 'react-markdown-editor'
import axios from 'axios'

export default class FormEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        description: ''
      }
    }
  }

  componentDidMount() {
    axios.get('/api/forms/'+this.props.match.params.id+'/')
      .then((results) => {
        this.setState({form: results.data});
      });
  }

  render() {
    return (
      <div>
        <MarkdownEditor iconsSet="font-awesome" initialContent="" content={this.state.form.description} />
      </div>
    )
  }
}

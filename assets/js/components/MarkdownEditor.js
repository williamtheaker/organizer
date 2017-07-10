import React from 'react'
import RichTextEditor from 'react-rte'

export default class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: RichTextEditor.createEmptyValue(),
      rendered: ''
    }
    if (props.value) {
      this.state.value = RichTextEditor.createValueFromString(props.value, 'markdown')
    }
    this.onChange = this.onChange.bind(this);
  }

  onChange(v) {
    const rendered = v.toString('markdown');
    this.props.onChange(rendered);
    this.setState({
      value: v,
      rendered: rendered
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value != nextProps.value) {
      console.log('new props', nextProps.value, this.props.value)
      this.setState({value: RichTextEditor.createValueFromString(nextProps.value, 'markdown')});
    }
  }

  render() {
    return <RichTextEditor
      onChange={this.onChange}
      value={this.state.value}
      onBlur={this.props.onBlur}
    />
  }
}

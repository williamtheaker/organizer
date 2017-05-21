import React from 'react'
import { Form, Text, Checkbox, Select } from 'react-form'
import _ from 'underscore'

export default class FormFieldForm extends React.Component {
  render() {
    var inputs = [];
    _.each(this.props.fields, (field) => {
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
      <Form>
        {inputs}
      </Form>
    )
  }
}

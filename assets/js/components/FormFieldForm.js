import React from 'react'
import { Form, Text, Checkbox, Select } from 'react-form'
import _ from 'lodash'

export default (props) => (
  <Form>
    {_.map(props.fields, (field) => {
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
        return  <label key={field.name}>{field.name} {element}</label>
      })
    }
  </Form>
)

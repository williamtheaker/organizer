import React from 'react'
import FormFieldForm from './FormFieldForm'
import { mount } from 'enzyme'

test('Smoke test', () => {
  const component = mount(<FormFieldForm fields={[]} />);

  let tree = component.html();
  expect(tree).toMatchSnapshot();
});

test('Single text field', () => {
  const fields = [{
    control_type: 0,
    id: 'field',
    name: 'Field Name'
  }]
  const component = mount(<FormFieldForm fields={fields} />);

  let tree = component.html();
  expect(tree).toMatchSnapshot();
  expect(component.find('input')).toHaveLength(1);
});

test('Single checkbox field', () => {
  const fields = [{
    control_type: 1,
    id: 'field',
    name: 'Field Name'
  }]
  const component = mount(<FormFieldForm fields={fields} />);

  let tree = component.html();
  expect(tree).toMatchSnapshot();
  expect(component.find('input[type="checkbox"]')).toHaveLength(1);
  expect(component.find('input')).toHaveLength(1);
});

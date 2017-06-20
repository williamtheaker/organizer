import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter as Router }  from 'react-router-dom'
import Header from './Header'

const WrappedHeader = (props) => (
  <Router>
    <Header {...props} />
  </Router>
)

test('Smoke test', () => {
  const component = mount(<WrappedHeader />);

  expect(component.html()).toMatchSnapshot();
})

test('Setting titles', () => {
  const component = mount(<WrappedHeader />);

  const blankHtml = component.html();
  expect(blankHtml).toMatchSnapshot();

  component.setProps({title: 'title'});
  expect(component.html()).toMatchSnapshot();

  component.setProps({subtitle: 'subtitle'});
  expect(component.html()).toMatchSnapshot();

  component.setProps({title: undefined, subtitle: undefined});
  expect(component.html()).toMatch(blankHtml);
})

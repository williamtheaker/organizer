import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter as Router }  from 'react-router-dom'
import MenuNavLink from './MenuNavLink'

const WrappedLink = (props) => (
  <Router>
    <MenuNavLink {...props} />
  </Router>
)

test('Smoke test', () => {
  const component = mount(<WrappedLink to="/" />);
  expect(component.html()).toMatchSnapshot();
});

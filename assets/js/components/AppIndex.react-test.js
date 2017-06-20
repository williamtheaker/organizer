import React from 'react'
import { mount } from 'enzyme'
import AppIndex from './AppIndex'

test('Smoke test', () => {
  global.SLACK_LOGIN_URL = "";
  const component = mount(<AppIndex />);
  expect(component.html()).toMatchSnapshot()
})

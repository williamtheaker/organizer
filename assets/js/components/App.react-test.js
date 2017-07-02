import React from 'react'
import App from './App'
import { mount } from 'enzyme'


test('Smoke test', () => {
  global.SLACK_LOGIN_URL = "";
  const component = mount(<App />);

  expect(component.html()).toMatchSnapshot();
})

import React from 'react'
import { mount } from 'enzyme'
import AppIndex from './AppIndex'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';

test('Smoke test', () => {
  global.SLACK_LOGIN_URL = "";
  const component = mount(<ThemeProvider><AppIndex /></ThemeProvider>);
  expect(component.html()).toMatchSnapshot()
})

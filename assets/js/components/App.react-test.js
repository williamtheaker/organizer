import React from 'react'
import App from './App'
import renderer from 'react-test-renderer'


test('Smoke test', () => {
  global.SLACK_LOGIN_URL = "";
  const component = renderer.create(<App />);

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
})

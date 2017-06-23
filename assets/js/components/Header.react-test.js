import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter as Router }  from 'react-router-dom'
import Header from './Header'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';

const WrappedHeader = (props) => (
  <ThemeProvider>
    <Router>
      <Header {...props} />
    </Router>
  </ThemeProvider>
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

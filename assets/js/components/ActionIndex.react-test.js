import React from 'react'
import fetchMock from 'fetch-mock'
import ActionIndex, { ActionCard } from './ActionIndex'
import { mount } from 'enzyme'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { MemoryRouter as Router } from 'react-router-dom'
import { Action, Signup } from '../Model'
import { CardText } from 'material-ui'
import ActivistCard from './ActivistCard'
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

describe('ActionIndex', () => {
  it('renders', () => {
    const component = mount(<Router><ThemeProvider><ActionIndex /></ThemeProvider></Router>);
    expect(component.html()).toMatchSnapshot()
  })
})

describe('ActionCard', () => {
  it('renders blank action', () => {
    const action = new Action();
    const component = mount(<Router><ThemeProvider><ActionCard action={action}/></ThemeProvider></Router>);
    expect(component.html()).toMatchSnapshot()
  })

  it('renders a complete action', () => {
    const action = new Action({
      description: 'Description',
      signups: [
        new Signup()
      ]
    });
    const component = mount(<Router><ThemeProvider><ActionCard action={action}/></ThemeProvider></Router>);
    expect(component.html()).toMatchSnapshot()
  })
})

import React from 'react'
import ActionReport from './ActionReport'
import { mount } from 'enzyme'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { MemoryRouter as Router } from 'react-router-dom'
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

describe('ActionReport', () => {
  it('renders new action', () => {
    const routeMatch = {
      params: {
        id: 'new'
      }
    }
    const component = mount(<Router><ThemeProvider><ActionReport match={routeMatch}/></ThemeProvider></Router>);
  })
})

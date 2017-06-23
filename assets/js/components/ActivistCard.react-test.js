import React from 'react'
import { mount } from 'enzyme'
import ActivistCard from './ActivistCard'
import { Activist } from '../Model'
import { DragDropContext } from 'react-dnd'
import TestBackend from 'react-dnd-test-backend'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';

const WrappedCard = DragDropContext(TestBackend)(ActivistCard)

test('Smoke test', () => {
  const activist = new Activist();
  const component = mount(<ThemeProvider><WrappedCard activist={activist} /></ThemeProvider>)
  expect(component.html()).toMatchSnapshot()
});

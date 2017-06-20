import React from 'react'
import { mount } from 'enzyme'
import ActivistCard from './ActivistCard'
import { Signup } from '../Model'
import { DragDropContext } from 'react-dnd'
import TestBackend from 'react-dnd-test-backend'

const WrappedCard = DragDropContext(TestBackend)(ActivistCard)

test('Smoke test', () => {
  const signup = new Signup();
  const component = mount(<WrappedCard signup={signup} />)
  expect(component.html()).toMatchSnapshot()
});

import fetchMock from 'fetch-mock'
import React from 'react'
import FormView, { FormInputView, SignupForm, Thanks } from './FormView'
import Spinner from './Spinner'
import { Form } from 'react-form'
import { Action } from '../Model'
import { shallow, mount } from 'enzyme'
import moment from 'moment'
import { MemoryRouter as Router } from 'react-router-dom'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import _ from 'lodash'
import { createWaitForElement } from 'enzyme-wait'

injectTapEventPlugin();

jest.mock('react-places-autocomplete', () => {
  return jest.fn(() => null);
});

afterEach(fetchMock.restore)

beforeEach(() => {
  global.Raven = {
    captureException: jest.fn(),
    captureBreadcrumb: jest.fn()
  }
})

describe('SignupForm', () => {
  it("should POST and call onSubmit on success", done => {
    fetchMock.postOnce('/api/actions/1/submit_response/', {
      status: 200,
      body: {}
    });
    const submitHandler = jest.fn(done)
    const action = new Action({id: 1});
    const component = mount(<ThemeProvider><SignupForm action={action} onSubmit={submitHandler} /></ThemeProvider>);
    component.find('form').simulate('submit');
    expect.hasAssertions();
    return fetchMock.flush().then(() => {
      expect(fetchMock.called()).toEqual(true);
    });
  });

  it("should POST and not call onSubmit on error", () => {
    fetchMock.postOnce('/api/actions/1/submit_response/', {
      status: 400
    });
    const submitHandler = jest.fn();
    const action = new Action({id: 1});
    const component = mount(<ThemeProvider><SignupForm action={action} onSubmit={submitHandler} /></ThemeProvider>);
    component.find('form').simulate('submit');
    return fetchMock.flush().then(() => {
      expect(fetchMock.called()).toEqual(true);
      expect(submitHandler).not.toHaveBeenCalled();
    })
  });
})

describe('FormView', () => {
  const urlMatch = {
    params: {
      id: '1'
    }
  }

  it('should load data if one is not embedded in the page', () => {
    global.INLINE_ACTION_DATA = undefined;
    fetchMock.getOnce('/api/actions/1/', {
      status: 200
    });
    const component = mount(<Router><ThemeProvider><FormView match={urlMatch} /></ThemeProvider></Router>);
    return fetchMock.flush().then(() => {
      expect(fetchMock.called()).toEqual(true);
    })
  })

  it('should not load data if one is embedded in the page', () => {
    global.INLINE_ACTION_DATA = {id: 1};
    fetchMock.getOnce('/api/actions/1/', {
      status: 200
    })
    const component = shallow(<Router><ThemeProvider><FormView match={urlMatch} /></ThemeProvider></Router>);
    return fetchMock.flush().then(() => {
      expect(fetchMock.called()).toEqual(false);
    })
  })

  it('should show the spinner while loading', () => {
    global.INLINE_ACTION_DATA = undefined;
    fetchMock.getOnce('/api/actions/1/', () => new Promise(() => {}))
    var component = shallow(<FormView match={urlMatch} />);
    expect(component.find(Thanks)).toHaveLength(0);
    expect(component.find(Spinner)).toHaveLength(1);
    expect(component.find(FormInputView)).toHaveLength(0);

    global.INLINE_ACTION_DATA = {id: 1};
    var component = shallow(<FormView match={urlMatch} />);
    expect(component.find(Thanks)).toHaveLength(0);
    expect(component.find(Spinner)).toHaveLength(0);
    expect(component.find(FormInputView)).toHaveLength(1);
  });

  it('should show the happy house and allow submitting another after successful submission', () => {
    global.INLINE_ACTION_DATA = {id: 1};
    fetchMock.postOnce('/api/actions/1/submit_response/', {
      status: 200
    })

    const component = mount(<Router><ThemeProvider><FormView match={urlMatch} /></ThemeProvider></Router>);
    component.find('input[type="text"]').first().simulate('change', {target: {value: 'root@localhost'}});
    component.find('form').simulate('submit');
    return fetchMock.flush().then(() => {
      expect(fetchMock.called()).toEqual(true);
      return createWaitForElement(Thanks)(component);
    }).then(() => {
      const errors = _.filter(_.map(component.find('p.error'), p => p ? p.text() : ''), v => v != '')
      expect(errors).toHaveLength(0);
      expect(component.find(SignupForm)).toHaveLength(0);
      expect(component.find(Spinner)).toHaveLength(0);
      expect(component.find(Thanks)).toHaveLength(1);

      component.find(Thanks).find('a').first().simulate('click')
      return createWaitForElement(SignupForm)(component)
    }).then(() => {
      expect(component.find(Thanks)).toHaveLength(0);
      expect(component.find(Spinner)).toHaveLength(0);
      expect(component.find(SignupForm)).toHaveLength(1);
    })
  });
});

describe('Thanks', () => {
  it('should have an option to submit another response', () => {
    const handler = jest.fn();
    const action = new Action();
    const component = shallow(<Thanks action={action} onSubmitAnother={() => handler()} />)
    component.find('a').simulate('click');
    expect(handler).toHaveBeenCalled()
  })
})

import React from 'react'
import fetchMock from 'fetch-mock'
import { mount, shallow } from 'enzyme'
import { Form, Submission, bindToState, withState } from './Model'
import { DjangoModel } from './ModelBase'
import jsc from 'jsverify'
import AmpersandModel from 'ampersand-model'

describe('HTTP Configuration', () => {
  it('Should send sessionid cookie and CSRF header on save', () => {
    fetchMock.postOnce('/api/testModel/', {})
    const TestModel = DjangoModel.extend({
      urlRoot: '/api/testModel/'
    });
    const testModel = new TestModel();
    testModel.save()
    expect(fetchMock.lastOptions().credentials).toEqual("include");
    const headers = fetchMock.lastOptions().headers;
    expect(headers).toHaveProperty("X-CSRFToken");
  })
})

describe('Submission saving', () => {
  function rejectErrors(submission) {
    return () => {
      return Promise.reject(submission.errors);
    }
  }
  function resolveErrors(submission) {
    return () => {
      return submission.errors;
    }
  }

  afterEach(() => {
    fetchMock.restore();
  });

  it('should post the correct data when saved', () => {
    fetchMock.postOnce('/api/forms/1/submit_response/', {
      status: 200,
    });
    const form = new Form({id: 1});
    const submission = new Submission({form: form})

    function checkPost(arg) {
      const lastPost = fetchMock.lastCall().json;
      const postedSub = new Submission({...lastPost, form: form})
      postedSub.form.action.set({date: submission.form.action.date})
      expect(postedSub.toJSON()).toEqual(submission.toJSON());
    }

    const response = submission.save();
    return expect(response.then(checkPost).then(resolveErrors(submission))).resolves.toEqual({});
  })

  it('should not raise any errors on a 200 response', () => {
    fetchMock.postOnce('/api/forms/1/submit_response/', {
      status: 200,
    });
    const submission = new Submission({form: new Form({id: 1})});
    const response = submission.save();
    return expect(response.then(resolveErrors(submission))).resolves.toEqual({});
  })

  it('should accept and set errors on 400 response', () => {
    return jsc.assertForall(jsc.dict(jsc.json), (errors) => {
      fetchMock.postOnce('/api/forms/1/submit_response/', {
        status: 400,
        body: {
          errors: errors
        }
      });
      const submission = new Submission({form: new Form({id: 1})});
      return expect(submission.save().catch(rejectErrors(submission)))
        .rejects
        .toEqual(errors).then(() => true);
    })
  })

  it('should reject on non-ok, non-400, response', () => {
    return jsc.assertForall(jsc.integer(401, 599), (status) => {
      fetchMock.postOnce('/api/forms/1/submit_response/', {
        status: status
      });
      const submission = new Submission({form: new Form({id: 1})});
      return expect(submission.save())
        .rejects
        .toBeDefined().then(() => true);
    })
  })

  it('should refuse to save a blank submission', () => {
    const submission = new Submission();
    return expect(() => submission.save()).toThrow(TypeError);
  });
})

describe('bindToState', () => {
  it('should update state on model change', () => {
    const Model = AmpersandModel.extend({
      props: {
        testProp: 'string'
      }
    })

    const modelInstance = new Model();

    class Component extends React.Component {
      constructor(props) {
        super(props);
        this.state = {}
        bindToState(this, props.model, {
          testProp: 'testProp'
        });
      }

      render() { return null }
    }

    const component = shallow(<Component model={modelInstance} />);
    expect(component.state()).toEqual({})

    modelInstance.set({testProp: 'value'})
    expect(component.state()).toEqual({testProp: 'value'})

    modelInstance.set({testProp: 'another value'})
    expect(component.state()).toEqual({testProp: 'another value'})
  })
})

describe('withState', () => {
  it('should render on prop change', () => {
    jest.useFakeTimers();
    const Model = AmpersandModel.extend({
      props: {
        testProp: 'string'
      }
    })

    const modelInstance = new Model();
    const renderSpy = jest.fn(() => <p />);

    class Component extends React.Component {
      render() {
        return renderSpy();
      }
    }

    const Wrapped = withState(Component)
    const component = mount(<Wrapped model={modelInstance}/>)

    expect(renderSpy).toHaveBeenCalledTimes(1);

    modelInstance.set({testProp: 'value'})
    jest.runAllTimers();
    expect(renderSpy).toHaveBeenCalledTimes(2);

    modelInstance.set({testProp: 'another value'})
    jest.runAllTimers();
    expect(renderSpy).toHaveBeenCalledTimes(3);

    const secondInstance = new Model();
    component.setProps({model: secondInstance})
    jest.runAllTimers();
    expect(renderSpy).toHaveBeenCalledTimes(4);

    secondInstance.set({testProp: 'value'})
    jest.runAllTimers();
    expect(renderSpy).toHaveBeenCalledTimes(5);

    component.unmount();
    modelInstance.set({testProp: 'yet another value'})
    expect(renderSpy).toHaveBeenCalledTimes(5);
  })
})

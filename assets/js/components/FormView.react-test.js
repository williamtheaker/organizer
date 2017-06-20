import React from 'react'
import FormView, { SignupForm, Thanks } from './FormView'
import { Form } from 'react-form'
import { mount } from 'enzyme'
import moment from 'moment'

test('Smoke test', () => {
  const match = {
    params: {
      id: 0
    }
  };
  const component = mount(<FormView match={match} />);

  let tree = component.html();
  expect(tree).toMatchSnapshot();
})

test('Render test', () => {
  const match = {
    params: {
      id: 0
    }
  };
  global.Raven = {
    captureBreadcrumb: jest.fn()
  };
  global.google = {
    maps: {
      places: {
        AutocompleteService: () => ({
          getPlacePredictions: jest.fn(),
        }),
        PlacesServiceStatus: {
          OK: 0
        }
      }
    }
  }
	global.INLINE_FORM_DATA = {
    "fields": [],
    "action": {
      "name": "Berkeley Did Something Stupid, Again",
      "date": moment("20111031", "YYYYMMDD").format()
    },
    "title": "Sign up for an action",
    "description": "Description of an action!",
    "url": "http://organizing.eastbayforward.org/api/forms/5/"
  };

  const component = mount(<FormView match={match} />);

  let tree = component.html();
  expect(tree).toMatchSnapshot();
});

test('Submit values test', () => {
	global.INLINE_FORM_DATA = {
    "fields": [],
    "action": {
      "name": "Berkeley Did Something Stupid, Again",
      "date": moment("20111031", "YYYYMMDD").format()
    },
    "title": "Sign up for an action",
    "description": "Description of an action!",
    "url": "http://organizing.eastbayforward.org/api/forms/5/"
  };
  const fields = [];
  const onSubmit = jest.fn();
  const component = mount(
    <Form onSubmit={onSubmit}>
      {({submitForm}) => (
        <SignupForm fields={fields} onSubmit={submitForm}/>
      )}
    </Form>
  );

  const instance = component.instance();
  const htmlForm = component.find('form').first();
  instance.setValue('email', 'email');
  instance.setValue('name', 'name');
  instance.setValue('address', 'address');
  instance.submitForm();

  const submission = onSubmit.mock.calls[0][0];
  expect(submission).toMatchSnapshot();
})

test('Shows thanks after submit', () => {
  const component = mount(<FormView />);
  expect(component.find(Thanks)).toHaveLength(0);
  component.setState({submitted: true});
  expect(component.find(Thanks)).toHaveLength(1);
  component.find(Thanks).find('a').first().simulate('click')
  expect(component.find(Thanks)).toHaveLength(0);
});

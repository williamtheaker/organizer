import React from 'react'
import FormView, { SignupForm, Thanks, FormInputView } from './FormView'
import Spinner from './Spinner'
import { Form } from 'react-form'
import { shallow, mount } from 'enzyme'
import moment from 'moment'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider';

test('Smoke test', () => {
  const match = {
    params: {
      id: 0
    }
  };
  const component = mount(<ThemeProvider><FormView match={match} /></ThemeProvider>);

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

  const component = mount(<ThemeProvider><FormView match={match} /></ThemeProvider>);

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
        <ThemeProvider><SignupForm fields={fields} onSubmit={submitForm}/></ThemeProvider>
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
  const component = shallow(<FormView />)
  component.setState({
    form: {
      action: {
        date: '',
        name: ''
      },
      description: ''
    }
  });
  expect(component.find(Thanks)).toHaveLength(0);
  expect(component.find(FormInputView)).toHaveLength(0);
  expect(component.find(Spinner)).toHaveLength(1);

  component.setState({loading: false});
  expect(component.find(Thanks)).toHaveLength(0);
  expect(component.find(FormInputView)).toHaveLength(1);
  expect(component.find(Spinner)).toHaveLength(0);

  component.setState({submitted: true});
  expect(component.find(Thanks)).toHaveLength(1);
  expect(component.find(FormInputView)).toHaveLength(0);
  expect(component.find(Spinner)).toHaveLength(0);
});

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

describe('Form input test', () => {
  function newForm() {
    const form = {
      title: '',
      description: '',
      action: {
        name: '',
      }
    };
    const submitHandler = jest.fn();
    return {handler: submitHandler, component: mount(
      <ThemeProvider>
        <FormInputView 
          form={form}
          serverError={''}
          onSubmit={submitHandler}
          dateAsMoment={moment()}
          eventDescription={{}}
        />
      </ThemeProvider>
    )};
  }

  test('Submit with empty data', () => {
    const {handler, component} = newForm();
    component.find('form').simulate('submit');
    expect(handler).toHaveBeenCalledTimes(1);
    const submittedValues = handler.mock.calls[0][0];
    const emptyValues = {}
    expect(submittedValues).toMatchSnapshot(emptyValues);
  });

})

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

test('Users can submit another at the end', () => {
  const handler = jest.fn();
  const form = {
    action: {
      name: ''
    }
  };
  const component = shallow(
    <Thanks
      onSubmitAnother={handler}
      form={form}
      asMoment={moment()} />
  );
  component.find('a').simulate('click');
  expect(handler).toHaveBeenCalledTimes(1);
})

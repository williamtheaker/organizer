import fetchMock from 'fetch-mock'
import { Form, Submission } from './Model'
import jsc from 'jsverify'

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

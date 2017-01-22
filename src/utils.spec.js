import utils from './utils.js';

describe('Utils', () => {
  describe('isEmail', () => {
    it('should return false if the email is Invalid', () => {
      const valid = utils.isEmail('@.com');
      expect(valid).toBeFalsy();
    });
    it('should return true if the email is valid', () => {
      const valid = utils.isEmail('_foo@example.com');
      expect(valid).toBeTruthy();
    });
  })
})

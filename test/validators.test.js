const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCode } = require('../src/validators');

test('room code accepts exactly five digits', () => {
  assert.equal(normalizeCode('12345'), '12345');
  assert.equal(normalizeCode(' 01234 '), '01234');
});

test('room code rejects other lengths and non-digits', () => {
  for (const value of ['1234', '123456', '12A45', 'ABCDE', '', null]) {
    assert.equal(normalizeCode(value), null);
  }
});

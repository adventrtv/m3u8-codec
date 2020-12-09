import QUnit from 'qunit';
// import sinon from 'sinon';

import VideojsCodec from '../src/codecs/videojs.js';
import LineCodec from '../src/codecs/line.js';

// import { tagSpec, typeSpec } from '../src/hls.js';

// const onlyMediaTags = tagSpec.filter((tag) => tag.playlistType !== 'manifest');
// const onlyManifestTags = tagSpec.filter((tag) => tag.playlistType !== 'media');

QUnit.module('Line-Codec', () => {

  // null-typed tag with no possible values
  QUnit.module('Null-Typed', {
    before() {
      this.simpleTag = [
        {
          name: '#EXT-TAG'
        }
      ];
    },
    beforeEach() {
      this.lineCodec = new LineCodec(this.simpleTag, null);
    }
  }, () => {
    QUnit.test('TAG is parsed correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG');

      assert.deepEqual(data, {
        name: '#EXT-TAG'
      });
    });

    QUnit.test('TAG is stringified correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG');
      const output = this.lineCodec.stringify(data);

      assert.strictEqual(output, '#EXT-TAG');
    });

    QUnit.test('TAG can NOT have a value', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-TAG:foo'), /Tag "[^"]+" has no value but found "[^"]+"./);
    });

    QUnit.test('Unknown TAGS are treated as comments', function(assert) {
      const output = this.lineCodec.parse('#EXT-FOO');

      assert.deepEqual(output, {
        name: 'comment',
        type: '<comment-line>',
        playlistType: 'both',
        value: '#EXT-FOO'
      });
    });

    QUnit.test('Lines starting with a # but not #EXT are interpreted as comments', function(assert) {
      const data = this.lineCodec.parse('#FOO');

      assert.deepEqual(data, {
        name: 'comment',
        type: '<comment-line>',
        playlistType: 'both',
        value: '#FOO'
      });
    });

    QUnit.test('TAG name is case sensitive', function(assert) {
      const data = this.lineCodec.parse('#ext-tag');

      assert.deepEqual(data, {
        name: 'comment',
        type: '<comment-line>',
        playlistType: 'both',
        value: '#ext-tag'
      });
    });

    QUnit.test('Custom TAGS can be added after codec initialization', function(assert) {
      this.lineCodec.setCustomTag({
        name: '#EXT-FOO',
        type: null
      });
      const data = this.lineCodec.parse('#EXT-FOO');

      assert.deepEqual(data, {
        name: '#EXT-FOO',
        type: null,
        playlistType: 'both',
        isCustom: true
      });
    });
  });

  // simply-typed tag with only a string value
  QUnit.module('Simple-Typed', {
    before() {
      this.stringValueTag = [
        {
          name: '#EXT-TAG',
          type: 'string'
        }
      ];
      this.stringValueType = {
        string: () => {
          return {
            parse: (output, str) => {
              output.value = str;
            },
            stringify: (obj) => {
              return obj.value;
            }
          };
        }
      };
    },
    beforeEach() {
      this.lineCodec = new LineCodec(this.stringValueTag, this.stringValueType);
    }
  }, () => {
    QUnit.test('TAG is parsed correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG:foo');

      assert.deepEqual(data, {
        name: '#EXT-TAG',
        type: 'string',
        value: 'foo'
      });
    });

    QUnit.test('TAG is stringified correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG:foo');
      const output = this.lineCodec.stringify(data);

      assert.strictEqual(output, '#EXT-TAG:foo');
    });

    QUnit.test('TAG MUST have a value', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-TAG'), /Tag "[^"]+" has a value but none were found./);
    });

    QUnit.test('Unknown TAGS are treated as comments', function(assert) {
      const output = this.lineCodec.parse('#EXT-FOO');

      assert.deepEqual(output, {
        name: 'comment',
        type: '<comment-line>',
        playlistType: 'both',
        value: '#EXT-FOO'
      });
    });

    QUnit.test('Custom TAG types can be added after codec initialization', function(assert) {
      this.lineCodec.setCustomTag({
        name: '#EXT-FOO',
        type: 'bar'
      }, { bar: this.stringValueType.string });

      const data = this.lineCodec.parse('#EXT-FOO:123');

      assert.deepEqual(data, {
        name: '#EXT-FOO',
        type: 'bar',
        value: '123',
        playlistType: 'both',
        isCustom: true
      });
    });
  });
});

import testDataExpected from './dist/test-expected.js';
import testDataManifests from './dist/test-manifests.js';
import testDataOutputs from './dist/test-output.js';

// This asserts that all the properties in the expected object are
// present in the actual but actual can contain ADDITIONAL properties
QUnit.assert.deepEqualWithExtra = function(actual, expected, message, child = false) {
  const mustHaveKeys = Object.keys(expected);

  for (let i = 0; i < mustHaveKeys.length; i++) {
    const key = mustHaveKeys[i];

    if (typeof expected[key] === 'object') {
      const result = QUnit.assert.deepEqualWithExtra(actual[key], expected[key], message, true);

      if (!result) {
        if (child) {
          return false;
        }
        return this.pushResult({
          result: false,
          actual,
          expected,
          message
        });
      }
    } else if (actual[key] !== expected[key]) {
      if (child) {
        return false;
      }
      return this.pushResult({
        result: false,
        actual,
        expected,
        message
      });
    }
  }
  this.pushResult({
    result: true,
    actual,
    expected,
    message
  });
  return true;
};

const isArrayEqualish = function(actual, expected) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    return false;
  }

  return expected.every((e) => {
    if (Array.isArray(e)) {
      const sameTag = actual.filter(a => a[0] === e[0]);

      return sameTag.some(ssub => isArrayEqualish(ssub, e));
    }
    return actual.indexOf(e) !== -1;
  });
};

QUnit.assert.arrayEqualWithExtra = function(actual, expected, message) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    return this.pushResult({
      result: false,
      actual,
      expected,
      message
    });
  }

  return this.pushResult({
    result: isArrayEqualish(actual, expected),
    actual,
    expected,
    message
  });
};

// Coax the output text into a format that can be compared without regard for order of lines
const makeComparableArrays = (str) => {
  const lines = str.split('\n').map(s => s.trim()).filter(s => s.length);

  const tagDataArray = lines.map(s => {
    const n = s.split(':');

    let r = n.slice(1);

    if (r.length > 0) {
      r = r.join(':');
    } else {
      r = '';
    }
    return [n[0], r];
  });

  let attributes = tagDataArray.map((a) => [a[0], a[1].replace(/="([^"]*)"$/g, (t, b) => `="${encodeURIComponent(b)}"`)]);

  attributes = attributes.map((a) => [a[0], a[1].replace(/="([^"]*)",/g, (t, b) => `="${encodeURIComponent(b)}",`)]);
  return attributes.map((a) => [a[0], ...a[1].split(',').filter(s => s.length)]);
};

QUnit.module('Fixtures', {
  before() {
    this.videojsCodec = new VideojsCodec();
    this.videojsCodec.setCustomTag({
      name: '#ZEN-TOTAL-DURATION',
      type: '<decimal-floating-point>'
    });
  }
}, () => {
  const keys = Object.keys(testDataManifests);
  const positiveTests = [];
  const negativeTests = [];

  keys.forEach((key) => {
    if (!testDataExpected[key]) {
      return;
    }
    if (/invalid|empty\w|negative/i.test(key)) {
      negativeTests.push(key);
    } else {
      positiveTests.push(key);
    }
  });

  QUnit.module('Positive Tests', () => {
    positiveTests.forEach((key) => {
      const manifest = testDataManifests[key];
      const expected = testDataExpected[key];
      const output = testDataOutputs[key];

      QUnit.module('Parsing Tests', {
        before() {
          this.videojsCodec = new VideojsCodec();
          this.videojsCodec.setCustomTag({
            name: '#ZEN-TOTAL-DURATION',
            type: '<decimal-floating-point>'
          });
        }
      }, () => {
        QUnit.test(`${key}.m3u8`, function(assert) {
          const result = this.videojsCodec.parse(manifest);

          assert.deepEqualWithExtra(
            result,
            expected,
            key + '.m3u8 was parsed correctly'
          );
        });
      });

      QUnit.module('Stringify Tests', {
        before() {
          this.videojsCodec = new VideojsCodec();
          this.videojsCodec.setCustomTag({
            name: '#ZEN-TOTAL-DURATION',
            type: '<decimal-floating-point>'
          });
        }
      }, () => {
        QUnit.test(`${key}.m3u8`, function(assert) {
          const result = this.videojsCodec.parse(manifest);
          const manifestComparable = makeComparableArrays(output || manifest);
          const serialized = this.videojsCodec.stringify(result);
          const serializedComparable = makeComparableArrays(serialized);

          assert.arrayEqualWithExtra(
            serializedComparable,
            manifestComparable,
            key + '.m3u8 was parsed correctly'
          );
        });
      });
    });
  });

  QUnit.module('Negative Tests', () => {
    negativeTests.forEach((key) => {
      const manifest = testDataManifests[key];

      QUnit.test(`${key}.m3u8`, function(assert) {
        assert.throws(() => {
          this.videojsCodec.parse(manifest);
        }, key + '.m3u8 failed correctly');
      });
    });
  });
});

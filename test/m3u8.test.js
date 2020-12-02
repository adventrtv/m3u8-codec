import QUnit from 'qunit';
import sinon from 'sinon';

import videojsCodec from '../src/videojs.js';

import makeLineCodec from '../src/line-codec.js';
import { tagSpec, typeSpec } from '../src/hls-spec.js';

// imports to help me build a new "type"
import makeValueCodecFactory from '../src/codecs/value.js';
import { makeRegexCodec } from '../src/codecs/regexp.js';

import testDataExpected from './dist/test-expected.js';
import testDataManifests from './dist/test-manifests.js';

const onlyMediaTags = tagSpec.filter((tag) => tag.playlistType !== 'manifest');
const onlyManifestTags = tagSpec.filter((tag) => tag.playlistType !== 'media');

QUnit.module('Line-Codec', () => {

  // null-typed tag with no possible values
  QUnit.module('Null-Typed', {
    before() {
      this.simpleTag = [
        {
          name: '#EXT-TAG',
          type: null
        }
      ];
    },
    beforeEach() {
      this.lineCodec = makeLineCodec(this.simpleTag, null);
    }
  }, () => {
    QUnit.test('TAG is parsed correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG');

      assert.deepEqual(data, {name: '#EXT-TAG', type: null, value: null, lineType: 'tag'});
    });

    QUnit.test('TAG is stringified correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG');
      const output = this.lineCodec.stringify(data);

      assert.strictEqual(output, '#EXT-TAG');
    });

    QUnit.test('TAG can NOT have a value', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-TAG:foo'),  /Tag "[^"]+" has no value but found "[^"]+"./);
    });

    QUnit.test('Unknown TAGS trigger an error', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-FOO'), /Found unknown tag "[^"]+"./);
    });

    QUnit.test('Lines starting with a # but not #EXT are interpreted as comments', function(assert) {
      const data = this.lineCodec.parse('#FOO');

      assert.deepEqual(data, {lineType: 'comment', value: '#FOO'});
    });

    QUnit.test('TAG name is case sensitive', function(assert) {
      const data = this.lineCodec.parse('#ext-tag');

      assert.deepEqual(data, {lineType: 'comment', value: '#ext-tag'});
    });

    QUnit.test('Custom TAGS can be added after codec initialization', function(assert) {
      this.lineCodec.setCustomTag({
        name: '#EXT-FOO',
        type: null
      });
      const data = this.lineCodec.parse('#EXT-FOO');

      assert.deepEqual(data, {name: '#EXT-FOO', type: null, value: null, lineType: 'tag'});
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
            stringify: (output, obj) => {
              return output + obj.value;
            }
          };
        }
      };
    },
    beforeEach() {
      this.lineCodec = makeLineCodec(this.stringValueTag, this.stringValueType);
    }
  }, () => {
    QUnit.test('TAG is parsed correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG:foo');

      assert.deepEqual(data, {name: '#EXT-TAG', type: 'string', value: 'foo', lineType: 'tag'});
    });

    QUnit.test('TAG is stringified correctly', function(assert) {
      const data = this.lineCodec.parse('#EXT-TAG:foo');
      const output = this.lineCodec.stringify(data);

      assert.strictEqual(output, '#EXT-TAG:foo');
    });

    QUnit.test('TAG MUST have a value', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-TAG'), /Tag "[^"]+" has a value but none were found./);
    });

    QUnit.test('Unknown TAGS trigger an error', function(assert) {
      assert.throws(() => this.lineCodec.parse('#EXT-FOO'), /Found unknown tag "[^"]+"./);
    });

    QUnit.test('Custom TAG types can be added after codec initialization', function(assert) {
      this.lineCodec.setCustomTag({
        name: '#EXT-FOO',
        type: 'bar'
      }, { number: this.stringValueType.string });

      const data = this.lineCodec.parse('#EXT-FOO:123');

      assert.deepEqual(data, {name: '#EXT-FOO', type: 'bar', value: '123', lineType: 'tag'});
    });
  });

});

QUnit.module('m3u8s');

QUnit.test('parses static manifests as expected', function(assert) {
  let key;

  for (key in testDataManifests) {
    if (testDataExpected[key]) {
      console.log('>>', key);
      if (/invalid|empty|missing/i.test(key)) {
        assert.throws(()=> {
          const manifest = videojsCodec.parse(testDataManifests[key]);
        });
      } else {
        const manifest = videojsCodec.parse(testDataManifests[key]);
        assert.deepEqual(
          manifest,
          testDataExpected[key],
          key + '.m3u8 was parsed correctly'
        );
      }
    }
  }
});

import videojsCodec from './videojs.js';
import m3u8NestedCodec from './m3u8-nested.js';
import m3u8Codec from './m3u8.js';
import lineCodec from './line-codec.js';
import { tagSpec, typeSpec } from './hls-spec.js';

// imports to help build a new "type"
import makeValueCodecFactory from './codecs/value.js';
import { makeRegexCodec } from './codecs/regexp.js';

export default {
  m3u8Codec,
  m3u8NestedCodec,
  videojsCodec,
  lineCodecFactory: lineCodec,
  hls: {
    tagSpec,
    typeSpec
  },
  typeHelpers: {
    makeValueCodecFactory,
    makeRegexCodec
  }
};

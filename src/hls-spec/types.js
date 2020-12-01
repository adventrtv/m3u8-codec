import { predefinedTypes } from '../codecs/regexp.js';
import { identity, parseDate, validateEnum } from '../codecs/type-casts.js';
import makeValueCodecFactory from '../codecs/value.js';
import attributeCodecFactory from '../codecs/attribute.js';

// Types specified in the HLS spec (plus a few convenient types _implied_ by the spec)

/* eslint dot-notation: 0 */
const typedCodecFactories = {
  '<decimal-integer>': makeValueCodecFactory(
    predefinedTypes['integer'],
    [parseFloat],
    ['value']
  ),

  '<decimal-floating-point>': makeValueCodecFactory(
    predefinedTypes['unsigned-floating-point'],
    [parseFloat],
    ['value']
  ),

  '<signed-decimal-floating-point>': makeValueCodecFactory(
    predefinedTypes['signed-floating-point'],
    [parseFloat],
    ['value']
  ),

  '<hexadecimal-sequence>': makeValueCodecFactory(
    predefinedTypes['hexadecimal-string'],
    [identity],
    ['value']
  ),

  '<quoted-string>': makeValueCodecFactory(
    predefinedTypes['quoted-string'],
    [identity],
    ['value']
  ),

  '<unquoted-string>': makeValueCodecFactory(
    predefinedTypes['everything-to-newline'],
    [identity],
    ['value']
  ),

  '<uri>': makeValueCodecFactory(
    predefinedTypes['everything-to-newline'],
    [identity],
    ['value']
  ),

  '<date-time-msec>': makeValueCodecFactory(
    predefinedTypes['date-time'],
    [parseDate],
    ['value']
  ),

  '<enumerated-string>': makeValueCodecFactory(
    predefinedTypes['enumerated-string'],
    [validateEnum],
    ['value']
  ),

  '<decimal-resolution>': makeValueCodecFactory(
    predefinedTypes['resolution'],
    [parseFloat, parseFloat],
    ['value.width', 'value.height']
  ),

  '<decimal-byterange>': makeValueCodecFactory(
    predefinedTypes['byterange'],
    [parseFloat, parseFloat],
    ['value.numBytes', 'value.startOffset']
  ),

  '<decimal-floating-point-duration>': makeValueCodecFactory(
    predefinedTypes['floating-point-duration'],
    [parseFloat, identity],
    ['value.duration', 'value.title']
  ),

  '<decimal-integer-duration>': makeValueCodecFactory(
    predefinedTypes['integer-duration'],
    [parseFloat, identity],
    ['value.duration', 'value.title']
  ),

  '<attribute-list>': attributeCodecFactory
};

export default typedCodecFactories;

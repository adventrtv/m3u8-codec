import { predefinedTypes } from '../codecs/regexp.js';
import { identity, dateCast, validateEnum, numberCast, hexCast } from '../codecs/type-casts.js';
import makeValueCodecFactory from '../codecs/value.js';
import attributeCodecFactory from '../codecs/attribute.js';

// Types specified in the HLS spec (plus a few convenient types _implied_ by the spec)

const dataTypeToHlsType = {
  toValue: (ctx, value, index, valuesArray) => {
    switch (value) {
    case 'quoted-string':
      return '<quoted-string>';
    case 'hexadecimal-string':
      return '<hexadecimal-sequence>';
    case 'unsigned-floating-point':
      return '<decimal-floating-point>'
    default:
      return null;
    }
  },
  fromValue: (ctx, value, index, valuesArray) => {
    switch (value) {
    case '<quoted-string>':
      return 'quoted-string';
    case '<hexadecimal-sequence>':
      return 'hexadecimal-string';
    case '<decimal-floating-point>':
      return 'unsigned-floating-point'
    default:
      return null;
    }
  }
};

const typeSensitiveCast = {
  toValue: (ctx, value, index, valuesArray) => {
    switch (valuesArray[1]) {
    case 'quoted-string':
      return identity.toValue(ctx, value, index, valuesArray);
    case 'hexadecimal-string':
      return hexCast.toValue(ctx, value, index, valuesArray);
    case 'unsigned-floating-point':
      return numberCast.toValue(ctx, value, index, valuesArray);
    default:
      return null;
    }
  },
  fromValue: (ctx, value, index, valuesArray) => {
    switch (valuesArray[1]) {
    case '<quoted-string>':
      return identity.fromValue(ctx, value, index, valuesArray);
    case '<hexadecimal-sequence>':
      return hexCast.fromValue(ctx, value, index, valuesArray);
    case '<decimal-floating-point>':
      return numberCast.fromValue(ctx, value, index, valuesArray);
    default:
      return null;
    }
  }
};

/* eslint dot-notation: 0 */
const typedCodecFactories = {
  '<decimal-integer>': makeValueCodecFactory(
    predefinedTypes['integer'],
    [numberCast],
    ['value']
  ),

  '<decimal-floating-point>': makeValueCodecFactory(
    predefinedTypes['unsigned-floating-point'],
    [numberCast],
    ['value']
  ),

  '<signed-decimal-floating-point>': makeValueCodecFactory(
    predefinedTypes['signed-floating-point'],
    [numberCast],
    ['value']
  ),

  '<hexadecimal-sequence>': makeValueCodecFactory(
    predefinedTypes['hexadecimal-string'],
    [hexCast],
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
    predefinedTypes['quoted-string'],
    [identity],
    ['value']
  ),

  '<date-time-msec>': makeValueCodecFactory(
    predefinedTypes['date-time'],
    [dateCast],
    ['value']
  ),

  '<enumerated-string>': makeValueCodecFactory(
    predefinedTypes['enumerated-string'],
    [validateEnum],
    ['value']
  ),

  '<decimal-resolution>': makeValueCodecFactory(
    predefinedTypes['resolution'],
    [numberCast, numberCast],
    ['value.width', 'value.height']
  ),

  '<decimal-byterange>': makeValueCodecFactory(
    predefinedTypes['byterange'],
    [numberCast, numberCast],
    ['value.length', 'value.offset']
  ),

  '<quoted-decimal-byterange>': makeValueCodecFactory(
    predefinedTypes['quoted-byterange'],
    [numberCast, numberCast],
    ['value.length', 'value.offset']
  ),

  '<decimal-floating-point-duration>': makeValueCodecFactory(
    predefinedTypes['floating-point-duration'],
    [numberCast, identity],
    ['value.duration', 'value.title']
  ),

  '<decimal-integer-duration>': makeValueCodecFactory(
    predefinedTypes['integer-duration'],
    [numberCast, identity],
    ['value.duration', 'value.title']
  ),

  '<attribute-list>': attributeCodecFactory,

  '<unknown-type>':  makeValueCodecFactory(
    predefinedTypes['might-be-any-type'],
    [typeSensitiveCast, dataTypeToHlsType],
    ['value', 'type']
  )
};

export default typedCodecFactories;

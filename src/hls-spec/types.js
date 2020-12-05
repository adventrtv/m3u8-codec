/* eslint dot-notation: 0 */
import { NamedCaptureMixin } from '../codecs/value.js';
import { AttributeType } from '../codecs/attribute.js';
import {
  IdentityType,
  IntegerType,
  UnsignedFloatingPointType,
  SignedFloatingPointType,
  HexadecimalSequenceType,
  RemainingLineType,
  DateTimeType,
  EnumeratedType,
  QuotedStringType,
  ByteRangeType,
  QuotedByteRangeType,
  ResolutionType,
  DurationType,
  FuzzyType
} from '../codecs/regexp.js';

import {
  identity,
  dateCast,
  validateEnum,
  numberCast,
  hexCast
} from '../codecs/type-casts.js';

const dataTypeToHlsType = {
  toValue: (ctx, value, index, valuesArray) => {
    switch (value) {
    case 'string':
      return '<quoted-string>';
    case 'hexadecimal':
      return '<hexadecimal-sequence>';
    case 'number':
      return '<decimal-signed-floating-point>';
    default:
      return null;
    }
  },
  fromValue: (ctx, value, index, valuesArray) => {
    switch (value) {
    case '<quoted-string>':
      return 'string';
    case '<hexadecimal-sequence>':
      return 'hexadecimal';
    case '<decimal-signed-floating-point>':
      return 'number';
    default:
      return null;
    }
  }
};

const typeSensitiveCast = {
  toValue: (ctx, value, index, valuesArray) => {
    switch (valuesArray[1]) {
    case 'string':
      return identity.toValue(ctx, value, index, valuesArray);
    case 'hexadecimal':
      return hexCast.toValue(ctx, value, index, valuesArray);
    case 'number':
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
    case '<decimal-signed-floating-point>':
      return numberCast.fromValue(ctx, value, index, valuesArray);
    default:
      return null;
    }
  }
};

// Types specified in the HLS spec (plus a few convenient types _implied_ by the spec)
export default {
  '<decimal-integer>': NamedCaptureMixin(IntegerType, [numberCast], ['value']),
  '<decimal-floating-point>': NamedCaptureMixin(UnsignedFloatingPointType, [numberCast], ['value']),
  '<signed-decimal-floating-point>': NamedCaptureMixin(SignedFloatingPointType, [numberCast], ['value']),
  '<hexadecimal-sequence>': NamedCaptureMixin(HexadecimalSequenceType, [hexCast], ['value']),
  '<quoted-string>': NamedCaptureMixin(QuotedStringType, [identity], ['value']),
  '<unquoted-string>': NamedCaptureMixin(EnumeratedType, [identity], ['value']),
  '<uri>': NamedCaptureMixin(QuotedStringType, [identity], ['value']),
  '<date-time-msec>': NamedCaptureMixin(DateTimeType, [dateCast], ['value']),
  '<quoted-enumerated-string>': NamedCaptureMixin(QuotedStringType, [validateEnum], ['value']),
  '<enumerated-string>': NamedCaptureMixin(EnumeratedType, [validateEnum], ['value']),
  '<decimal-resolution>': NamedCaptureMixin(ResolutionType, [numberCast, numberCast], ['value.width', 'value.height']),
  '<decimal-byterange>': NamedCaptureMixin(ByteRangeType, [numberCast, numberCast], ['value.length', 'value.offset']),
  '<quoted-decimal-byterange>': NamedCaptureMixin(QuotedByteRangeType, [numberCast, numberCast], ['value.length', 'value.offset']),
  '<decimal-floating-point-duration>': NamedCaptureMixin(DurationType, [numberCast, identity], ['value.duration', 'value.title']),
  '<decimal-integer-duration>': NamedCaptureMixin(DurationType, [numberCast, identity], ['value.duration', 'value.title']),
  '<attribute-list>': AttributeType,
  '<unknown-type>': NamedCaptureMixin(FuzzyType, [typeSensitiveCast, dataTypeToHlsType], ['value', 'type']),
};

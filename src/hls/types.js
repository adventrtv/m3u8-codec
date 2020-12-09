/* eslint dot-notation: 0 */
import CastingMixin from '../types/casting-mixin.js';
import NamedPropertyMixin from '../types/named-property-mixin.js';
import AttributeType from '../types/attribute-type.js';
import {
  IdentityType,
  IntegerType,
  UnsignedFloatingPointType,
  SignedFloatingPointType,
  HexadecimalSequenceType,
  DateTimeType,
  EnumeratedType,
  QuotedStringType,
  ByteRangeType,
  QuotedByteRangeType,
  ResolutionType,
  DurationType,
  FuzzyType
} from '../types/regexp-types.js';

import {
  identity,
  dateCast,
  validateEnum,
  numberCast,
  hexCast
} from '../types/type-casts.js';

const dataTypeToHLSType = {
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

const HLSType = (Type, typeCastsArray, captureNamesArray) => NamedPropertyMixin(CastingMixin(Type, typeCastsArray), captureNamesArray);

class NullType extends IdentityType {
  regexp = null;

  parse() {
    return super.parse('');
  }

  stringify() {
    return super.stringify([]);
  }
}

// Types specified in the HLS spec (plus a few convenient types _implied_ by the spec)
export default {
  '<decimal-integer>': HLSType(IntegerType, [numberCast], ['value']),
  '<decimal-floating-point>': HLSType(UnsignedFloatingPointType, [numberCast], ['value']),
  '<signed-decimal-floating-point>': HLSType(SignedFloatingPointType, [numberCast], ['value']),
  '<hexadecimal-sequence>': HLSType(HexadecimalSequenceType, [hexCast], ['value']),
  '<quoted-string>': HLSType(QuotedStringType, [identity], ['value']),
  '<unquoted-string>': HLSType(EnumeratedType, [identity], ['value']),
  '<uri>': HLSType(QuotedStringType, [identity], ['value']),
  '<date-time-msec>': HLSType(DateTimeType, [dateCast], ['value']),
  '<quoted-enumerated-string>': HLSType(QuotedStringType, [validateEnum], ['value']),
  '<enumerated-string>': HLSType(EnumeratedType, [validateEnum], ['value']),
  '<decimal-resolution>': HLSType(ResolutionType, [numberCast, numberCast], ['value.width', 'value.height']),
  '<decimal-byterange>': HLSType(ByteRangeType, [numberCast, numberCast], ['value.length', 'value.offset']),
  '<quoted-decimal-byterange>': HLSType(QuotedByteRangeType, [numberCast, numberCast], ['value.length', 'value.offset']),
  '<decimal-floating-point-duration>': HLSType(DurationType, [numberCast, identity], ['value.duration', 'value.title']),
  '<decimal-integer-duration>': HLSType(DurationType, [numberCast, identity], ['value.duration', 'value.title']),
  '<attribute-list>': HLSType(AttributeType, [identity], ['value']),
  '<unknown-type>': HLSType(FuzzyType, [typeSensitiveCast, dataTypeToHLSType], ['value', 'type']),
  '<everything>': HLSType(IdentityType, [identity], ['value']),
  '<null>': NullType
};

import VideojsCodec from './codecs/videojs.js';
import M3U8NestedCodec from './codecs/m3u8-nested.js';
import M3U8Codec from './codecs/m3u8.js';
import LineCodec from './codecs/line.js';
import { tagSpec, typeSpec } from './hls.js';
import CastingMixin from './types/casting-mixin.js';
import NamedPropertyMixin from './types/named-property-mixin.js';
import AttributeType from './types/attribute-type.js';
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
} from './types/regexp-types.js';
import {
  identity,
  dateCast,
  validateEnum,
  numberCast,
  hexCast
} from './types/type-casts.js';

export default {
  codecs: {
    VideojsCodec,
    M3U8NestedCodec,
    M3U8Codec,
    LineCodec
  },
  hls: {
    tagSpec,
    typeSpec
  },
  types: {
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
    FuzzyType,
    AttributeType
  },
  casts: {
    identity,
    dateCast,
    validateEnum,
    numberCast,
    hexCast
  },
  mixins: {
    CastingMixin,
    NamedPropertyMixin
  }
};

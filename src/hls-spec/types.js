import { predefinedTypes } from '../codecs/regexp.js'

const noop = (v) => v;

const validateEnum = (value, ctx) => {
  const enumValues = ctx?.enum;

  if (!enumValues) {
    throw new Error(`Type "${ctx.name}" does not specify a list of enum values.`);
  }
  if (enumValues.indexOf(value) === -1) {
    console.log(ctx);
    throw new Error(`Value "${value}"" not found in enum: ${ctx.name} => [${enumValues}].`);
  }

  return value;
};

const parseDate = (value, ctx) => new Date(value);

const getProperty = (obj, propArray) => {
  return propArray.reduce((subObj, prop) => {
    if (subObj) {
      return subObj[prop];
    }
    return subObj;
  }, obj);
};

const setProperty = (obj, propArray, value) => {
  propArray.reduce((subObj, prop, index) => {
    if (index === propArray.length - 1) {
      subObj[prop] = value;
      return;
    }
    return subObj[prop] = subObj[prop] || {};
  }, obj);

  return obj;
};

const regexpCodec = (typeRegexp, casterArray = [noop], namedCaptureArray = ['value']) => {
  const capturePropertyPaths = namedCaptureArray.map(c => c.split('.'));

  if (!typeRegexp) {
    throw new Error('The "makeRegexCodec" must not be undefined.');
  }

  if (!Array.isArray(casterArray) || !Array.isArray(namedCaptureArray) || casterArray.length !== namedCaptureArray.length) {
    throw new Error('The arguments "casterArray" and "namedCaptureArray" must be arrays with the same length.');
  }

  return (typeContext) => {
    return {
      parse: (output, str) => {
        const allMatches = typeRegexp.parse(str);

        if (!allMatches || allMatches.length < 2) {
          throw new Error(`Error parsing type "${type}" from string "${str}".`);
        }

        const consumedChars = allMatches[0].length;
        const matches = allMatches.slice(1);

        capturePropertyPaths.forEach((capturePropertyPath, index) => {
          if (matches.length < index) {
            return;
          }

          const match = matches[index];

          if (match !== undefined) {
            const matchCaster = casterArray[index];
            const matchValue = matchCaster(match, typeContext);

            setProperty(output, capturePropertyPath, matchValue);
          }
        });

        return [output.value, consumedChars];
      },
      stringify: (output, obj) => {
        const matches = [];

        capturePropertyPaths.forEach((capturePropertyPath, index) => {
          const value = getProperty(obj, capturePropertyPath);

          if (value !== null && value !== undefined) {
            matches[index] = value;
          }
        });

        return output + typeRegexp.stringify([null, ...matches]);
      }
    };
  };
};

import attributeCodec from '../codecs/attribute.js';

// Types specified in the HLS spec
// all return [value, charsConsumed]
const codecs = {
  '<decimal-integer>': regexpCodec(predefinedTypes['integer'], [parseFloat]),
  '<decimal-floating-point>': regexpCodec(predefinedTypes['unsigned-floating-point'], [parseFloat]),
  '<signed-decimal-floating-point>': regexpCodec(predefinedTypes['signed-floating-point'], [parseFloat]),
  '<hexadecimal-sequence>': regexpCodec(predefinedTypes['hexadecimal-string']),
  '<quoted-string>': regexpCodec(predefinedTypes['quoted-string']),
  '<unquoted-string>': regexpCodec(predefinedTypes['everything-to-newline']),
  '<uri>': regexpCodec(predefinedTypes['everything-to-newline']),
  '<date-time-msec>': regexpCodec(predefinedTypes['date-time'], [parseDate]),
  '<enumerated-string>': regexpCodec(predefinedTypes['enumerated-string'], [validateEnum]),
  '<decimal-resolution>': regexpCodec(predefinedTypes['resolution'], [parseFloat, parseFloat], ['value.width', 'value.height']),
  '<decimal-byterange>': regexpCodec(predefinedTypes['byterange'], [parseFloat, parseFloat], ['value.numBytes', 'value.startOffset']),
  '<decimal-floating-point-duration>': regexpCodec(predefinedTypes['floating-point-duration'], [parseFloat, noop], ['value.duration', 'value.title']),
  '<decimal-integer-duration>': regexpCodec(predefinedTypes['integer-duration'], [parseFloat, noop], ['value.duration', 'value.title']),
  '<attribute-list>': attributeCodec
};

export default codecs;

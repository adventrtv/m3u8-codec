const makeRegexCodec = (regexp, format) => {
  return {
    dec: (str) => str.match(regexp),
    enc: (obj) => format(obj)
  };
};

const dateToString = (matches) => matches[1].toISOString();

const singleMatchToString = (matches) => `${matches[1]}`;

const singleMatchToQuotedString = (matches) => `"${matches[1]}"`;

const resolutionToString = (matches) => `${matches[1]}x${matches[2]}`

const byteRangeToString = (matches) => {
  return `${matches[1]}${!isNaN(matches[2]) ? '@' + matches[2] : ''}`;
};

const durationToString = (matches) => {
  return `${matches[1]},${matches[2] ? matches[2] : ''}`;
};

const regexps = {
  '<decimal-integer>': makeRegexCodec(/^([0-9]{1,20})/, singleMatchToString),
  '<decimal-floating-point>': makeRegexCodec(/^([0-9]+.?[0-9]*)/, singleMatchToString),
  '<signed-decimal-floating-point>': makeRegexCodec(/^(-?[0-9]+.?[0-9]*)/, singleMatchToString),
  '<hexadecimal-sequence>': makeRegexCodec(/^(0[xX][0-9A-Fa-f]+)/, singleMatchToString),
  '<quoted-string>': makeRegexCodec(/^"([^\n"]*)"/, singleMatchToQuotedString),
  '<unquoted-string>': makeRegexCodec(/^([^\n]*)/, singleMatchToString),
  '<date-time-msec>': makeRegexCodec(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:(?:[+-]\d\d:\d\d)|Z))/, dateToString),
  '<enumerated-string>': makeRegexCodec(/^([^\s,"]+)/, singleMatchToString),
  '<decimal-resolution>': makeRegexCodec(/^([1-9][0-9]*)x([1-9][0-9]*)/, resolutionToString),
  '<decimal-byterange>': makeRegexCodec(/^([0-9]+)@?([0-9]*)/, byteRangeToString),
  '<decimal-floating-point-duration>': makeRegexCodec(/^([0-9]+.?[0-9]*),([^\n]*)/, durationToString),
  '<decimal-integer-duration>': makeRegexCodec(/^([0-9]+),([^\n]*)/, durationToString)
};

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

const regexpConvert = (type, cast = noop, namedCaptures = null) => {
  const typeRegexp = regexps[type];

  return {
    dec: (output, str, context) => {
      const matches = typeRegexp.dec(str);

      if (!matches || matches.length < 2) {
        throw new Error(`Error parsing type "${type}" from string "${str}".`);
      }
      let castArray = Array.isArray(cast) ? cast : [cast];
      const consumedChars = matches[0].length;

      if (!namedCaptures) {
        const matchCast = castArray[0];
        const match = matches[1];
        const value = matchCast(match, context);

        if (output) {
          output.value = value
        }

        return [value, consumedChars];
      }

      let valObj = output;

      if (!output) {
        valObj = {};
      }

      namedCaptures.forEach((captureName, index) => {
        if (matches.length >= index + 1) {
          const matchCast = castArray[index];
          const match = matches[index + 1];

          valObj[captureName] = matchCast(match, context);
        }
      });

      return [valObj, consumedChars];
    },
    enc: (output, obj, context) => {
      // I don't like this!
      const value = obj.value || obj;

      if (!namedCaptures) {
        return output + typeRegexp.enc([null, obj.value]);
      }

      const matches = [null];

      namedCaptures.forEach((captureName, index) => {
        if (value[captureName] !== null && value[captureName] !== undefined) {
          matches[index + 1] = value[captureName];
        }
      });

      return output + typeRegexp.enc(matches);
    }
  };
};

// all return [value, charsConsumed]
const codecs = {
  '<decimal-integer>': regexpConvert('<decimal-integer>', parseFloat),
  '<decimal-floating-point>': regexpConvert('<decimal-floating-point>', parseFloat),
  '<signed-decimal-floating-point>': regexpConvert('<decimal-floating-point>', parseFloat),
  '<hexadecimal-sequence>': regexpConvert('<hexadecimal-sequence>'),
  '<quoted-string>': regexpConvert('<quoted-string>'),
  '<unquoted-string>': regexpConvert('<unquoted-string>'),
  '<date-time-msec>': regexpConvert('<date-time-msec>', parseDate),
  '<enumerated-string>': regexpConvert('<enumerated-string>', validateEnum),
  '<decimal-resolution>': regexpConvert('<decimal-resolution>', [parseFloat, parseFloat], ['width', 'height']),
  '<decimal-byterange>': regexpConvert('<decimal-byterange>', [parseFloat, parseFloat], ['numBytes', 'startOffset']),
  '<decimal-floating-point-duration>': regexpConvert('<decimal-floating-point-duration>', [parseFloat, noop], ['duration', 'title']),
  '<decimal-integer-duration>': regexpConvert('<decimal-integer-duration>', [parseFloat, noop], ['duration', 'title']),
  '<attribute-list>': {
    dec: (output, str, typeContext) => {
      let currentStr = str;
      const attributes = output.attributes = {};

      while(currentStr.length) {
        const equalsOffset = currentStr.indexOf('=');

        if (equalsOffset === -1) {
          throw new Error(`Malformed attribute string at "${currentStr}".`);
        }

        // get attribute name
        const attributeName = currentStr.slice(0, equalsOffset);

        // str.slice(attribute name length)
        currentStr = currentStr.slice(equalsOffset + 1);

        // look-up type
        let attributeType = typeContext.attributes[attributeName] || typeContext.attributes['*'];

        if (!attributeType) {
          throw new Error(`Attribute "${attributeName}" not allowed on tag "${typeContext.name}".`);
        }

        // get attribute value
        const [attributeValue, charsConsumed] = codecs[attributeType.type].dec(null, currentStr, attributeType);

        // str.slice(attribute name length)
        currentStr = currentStr.slice(charsConsumed + 1);

        attributes[attributeName] = Object.assign({}, attributeType);

        attributes[attributeName].value = attributeValue;
      }
    },
    enc: (output, obj, typeContext) => {
      const attributes = output.attributes = {};
      const attributeNames = Object.keys(obj.attributes);
      const attributeStrings = attributeNames.map((attributeName) => {
        const attributeValue = obj.attributes[attributeName];
        // look-up type
        let attributeType = typeContext.attributes[attributeName] || typeContext.attributes['*'];

        if (!attributeType) {
          throw new Error(`Attribute "${attributeName}" not allowed on tag "${typeContext.name}".`);
        }

        return attributeName + '=' + codecs[attributeType.type].enc(output, attributeValue, attributeType);
      });

      return output + attributeStrings.join(',');
    }
  }
};

module.exports = codecs;

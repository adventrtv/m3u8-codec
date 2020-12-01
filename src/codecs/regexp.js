// Takes two objects:
// regexp is a RegExp object that we use match with to generate a set of matches
// stringify is a function that takes the same matches and outputs the original string
export const makeRegexCodec = (regexp, stringify) => {
  return {
    parse: (str) => str.match(regexp),
    stringify: (obj) => stringify(obj)
  };
};

const singleMatchToString = (matches) => `${matches[1]}`;

const singleMatchToQuotedString = (matches) => `"${matches[1]}"`;

const dateToString = (matches) => matches[1].toISOString();

const resolutionToString = (matches) => `${matches[1]}x${matches[2]}`;

const byteRangeToString = (matches) => {
  return `${matches[1]}${!isNaN(matches[2]) ? '@' + matches[2] : ''}`;
};

const durationToString = (matches) => {
  return `${matches[1]},${matches[2] ? matches[2] : ''}`;
};

// Somewhat generic types that are used to more specific HLS-type parsers below
export const predefinedTypes = {
  'integer': makeRegexCodec(/^([0-9]{1,20})/, singleMatchToString),
  'unsigned-floating-point': makeRegexCodec(/^([0-9]+.?[0-9]*)/, singleMatchToString),
  'signed-floating-point': makeRegexCodec(/^([-+]?[0-9]+.?[0-9]*)/, singleMatchToString),
  'hexadecimal-string': makeRegexCodec(/^(0[xX][0-9A-Fa-f]+)/, singleMatchToString),
  'quoted-string': makeRegexCodec(/^"([^\n"]*)"/, singleMatchToQuotedString),
  'everything-to-newline': makeRegexCodec(/^([^\n]*)/, singleMatchToString),
  'date-time': makeRegexCodec(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:(?:[+-]\d\d:\d\d)|Z))/, dateToString),
  'enumerated-string': makeRegexCodec(/^([^\s,"]+)/, singleMatchToString),
  'resolution': makeRegexCodec(/^([1-9][0-9]*)[xX]([1-9][0-9]*)/, resolutionToString),
  'byterange': makeRegexCodec(/^([0-9]+)@?([0-9]*)/, byteRangeToString),
  'floating-point-duration': makeRegexCodec(/^([0-9]+.?[0-9]*),([^\n]*)/, durationToString),
  'integer-duration': makeRegexCodec(/^([0-9]+),([^\n]*)/, durationToString)
};

import { identity } from './type-casts.js';

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
    subObj[prop] = subObj[prop] || {};

    return subObj[prop];
  }, obj);

  return obj;
};

const makeValueCodecFactory = (typeRegexpCodec, casterArray = [identity], namedCaptureArray = ['value']) => {
  const capturePropertyPaths = namedCaptureArray.map(c => c.split('.'));

  if (!typeRegexpCodec) {
    throw new Error('The "typeRegexpCodec" argument must not be undefined.');
  }

  if (!Array.isArray(casterArray) || !Array.isArray(namedCaptureArray) || casterArray.length !== namedCaptureArray.length) {
    throw new Error('The arguments "casterArray" and "namedCaptureArray" must be arrays with the same length.');
  }

  return (typeContext) => {
    return {
      parse: (output, str) => {
        const allMatches = typeRegexpCodec.parse(str);

        if (!allMatches || allMatches.length < 2) {
          throw new Error(`Error parsing type "${typeContext.type}" from string "${str}".`);
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

        return consumedChars;
      },
      stringify: (output, obj) => {
        const matches = [];

        capturePropertyPaths.forEach((capturePropertyPath, index) => {
          const value = getProperty(obj, capturePropertyPath);

          if (value !== null && value !== undefined) {
            matches[index] = value;
          }
        });

        const stringifiedObj = typeRegexpCodec.stringify([null, ...matches]);

        output += stringifiedObj;

        return output;
      }
    };
  };
};

export default makeValueCodecFactory;

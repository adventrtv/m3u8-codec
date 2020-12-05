import { setProperty, getProperty } from '../helpers/props.js';

// Usage:
// class Foo extends NamedCaptureMixin(FuzzyType, [integer], ['value']) {};
export const NamedCaptureMixin = (Type, typeCastsArray, captureNamesArray) => class extends Type {
  #capturePropertyPaths = captureNamesArray.map(c => c.split('.'));
  #casterArray = typeCastsArray;
  #typeContext;

  constructor(typeContext) {
    super();
    this.#typeContext = typeContext;
  }

  parse(output, str) {
    const matches = super.parse(str);

    if (!matches || matches.length < 1) {
      throw new Error(`Error parsing type "${this.typeContext.type}" from string "${str}".`);
    }
    const consumedChars = matches.consumedChars;

    // Each capture path defines where to place each capture group in the original regex
    this.#capturePropertyPaths.forEach((capturePropertyPath, index) => {
      if (matches.length < index) {
        return;
      }
      const match = matches[index];

      if (match !== undefined) {
        const matchCaster = this.#casterArray[index];
        const matchValue = matchCaster.toValue(this.#typeContext, match, index, matches);

        setProperty(output, capturePropertyPath, matchValue);
      }
    });

    return consumedChars;
  }

  stringify(output, obj) {
    const values = [];

    this.#capturePropertyPaths.forEach((capturePropertyPath, index) => {
      const value = getProperty(obj, capturePropertyPath);

      if (value !== null && value !== undefined) {
        values[index] = value;
      }
    });
    const matches = values.reduce((matches, match, index) => {
      const matchCaster = this.#casterArray[index];
      matches[index] = matchCaster.fromValue(this.#typeContext, match, index, values);
      return matches;
    }, []);
    const stringifiedObj = super.stringify(matches);

    output += stringifiedObj;

    return output;
  }
};

import { setProperty, getProperty } from '../helpers/props.js';

const mergeArray = (orig, current, dedupeProperty = 'name') => {
  const output = [...orig];

  current.forEach((el) => {
    const foundIndex = output.findIndex((o) => o[dedupeProperty] === el[dedupeProperty]);

    if (foundIndex > -1) {
      output[foundIndex] = el;
    } else {
      output.push(el);
    }
  });

  return output;
};

export default (Type, captureNamesArray) => class extends Type {
  #capturePropertyPaths = captureNamesArray.map(c => c.split('.'));
  #typeContext;

  constructor(typeContext) {
    super(typeContext);
    this.#typeContext = typeContext;
  }

  parse(output, str) {
    const matches = [];
    const consumedChars = super.parse(matches, str);

    if (!matches || matches.length < this.#capturePropertyPaths.length) {
      throw new Error(`Error parsing type "${this.typeContext.type}" from string "${str}".`);
    }

    // Each capture path defines where to place each capture group in the original regex
    this.#capturePropertyPaths.forEach((capturePropertyPath, index) => {
      if (matches.length < index) {
        return;
      }
      const match = matches[index];

      if (match !== undefined) {
        const origValue = getProperty(output, capturePropertyPath);

        if (Array.isArray(origValue)) {
          setProperty(output, capturePropertyPath, mergeArray(origValue, match));
        } else {
          setProperty(output, capturePropertyPath, match);
        }
      }
    });

    return consumedChars;
  }

  stringify(obj) {
    const values = [];

    this.#capturePropertyPaths.forEach((capturePropertyPath, index) => {
      const value = getProperty(obj, capturePropertyPath);

      if (value !== null && value !== undefined) {
        values[index] = value;
      }
    });

    return super.stringify(values);
  }
};

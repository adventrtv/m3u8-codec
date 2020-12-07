export default (Type, typeCastsArray) => class extends Type {
  #casterArray = typeCastsArray;
  #typeContext;

  constructor(typeContext) {
    super(typeContext);
    this.#typeContext = typeContext;
  }

  parse(output, str) {
    const matches = super.parse(str);

    if (!matches || matches.length < this.#casterArray.length) {
      throw new Error(`Error parsing type "${this.typeContext.type}" from string "${str}".`);
    }
    const consumedChars = matches.consumedChars;

    this.#casterArray.forEach((matchCaster, index) => {
      if (matches.length < index) {
        return;
      }
      const match = matches[index];

      if (match !== undefined) {
        output[index] = matchCaster.toValue(this.#typeContext, match, index, matches);
      }
    });

    return consumedChars;
  }

  stringify(values) {
    const matches = this.#casterArray.map((matchCaster, index) => {
      const value = values[index];

      return matchCaster.fromValue(this.#typeContext, value, index, values);
    });

    return super.stringify(matches);
  }
};

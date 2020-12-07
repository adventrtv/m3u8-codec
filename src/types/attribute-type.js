export default class AttributeType {
  #typeContext;

  constructor(typeContext) {
    this.#typeContext = typeContext;
  }

  parse(str) {
    let currentStr = str;
    const attributes = [];

    while (currentStr.length) {
      const equalsOffset = currentStr.indexOf('=');

      if (equalsOffset === -1) {
        throw new Error(`Malformed attribute string at "${currentStr}".`);
      }

      // get attribute name
      const attributeName = currentStr.slice(0, equalsOffset).trim();

      // str.slice(attribute name length)
      currentStr = currentStr.slice(equalsOffset + 1);

      // look-up type
      const attributeType = this.#typeContext.attributes.get(attributeName) || this.#typeContext.attributes.get('UNKNOWN-ATTRIBUTE');

      if (!attributeType) {
        throw new Error(`Attribute "${attributeName}" not allowed on tag "${this.#typeContext.name}".`);
      }
      // create a new attribute object
      const attributeObj = attributeType.createInstance();

      if (attributeObj.name !== attributeName) {
        attributeObj.name = attributeName;
      }

      attributes.push(attributeObj);

      // get attribute value
      const charsConsumed = attributeType.parse(attributeObj, currentStr);

      // str.slice(attribute name length)
      currentStr = currentStr.slice(charsConsumed + 1);
    }

    return [ attributes ];
  }

  stringify(matches) {
    const attributes = matches[0];

    if (!attributes) {
      return '';
    }

    const attributeStrings = attributes.map((attributeObj) => {
      // look-up type
      const attributeType = this.#typeContext.attributes.get(attributeObj.name) || this.#typeContext.attributes.get('UNKNOWN-ATTRIBUTE');

      if (!attributeType) {
        throw new Error(`Attribute "${attributeObj.name}" not allowed on tag "${this.#typeContext.name}".`);
      }

      return attributeObj.name + '=' + attributeType.stringify(attributeObj);
    });

    return attributeStrings.join(',');
  }
}

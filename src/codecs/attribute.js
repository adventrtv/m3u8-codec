const findAttr = (tag, attrName) => tag?.value.find(a => a.name === attrName);

export class AttributeType {
  #typeContext;

  constructor(typeContext) {
    this.#typeContext = typeContext;
  }

  parse(output, str) {
    let currentStr = str;
    const attributes = output.value || (output.value = []);

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
      let attributeType = this.#typeContext.attributes.get(attributeName) || this.#typeContext.attributes.get('UNKNOWN-ATTRIBUTE');

      if (!attributeType) {
        throw new Error(`Attribute "${attributeName}" not allowed on tag "${this.#typeContext.name}".`);
      }
      // create a new attribute object
      const attributeObj = findAttr(output, attributeName) || attributeType.createInstance();

      if (attributeObj.name !== attributeName) {
        attributeObj.name = attributeName;
      }

      attributes.push(attributeObj);

      // get attribute value
      const charsConsumed = attributeType.parse(attributeObj, currentStr);

      // str.slice(attribute name length)
      currentStr = currentStr.slice(charsConsumed + 1);
    }
  }

  stringify(output, obj) {
    const attributes = obj.value;

    if (!attributes) {
      return output;
    }

    // const attributeProperties = Object.keys(attributes);
    const attributeStrings = attributes.map((attributeObj) => {

    // const attributeStrings = attributeProperties.map((attributeProperty) => {
      // const attributeValue = attributes[attributeProperty];
      // look-up type
      const attributeType = this.#typeContext.attributes.get(attributeObj.name) || this.#typeContext.attributes.get('UNKNOWN-ATTRIBUTE');

      if (!attributeType) {
        throw new Error(`Attribute "${attributeObj.name}" not allowed on tag "${this.#typeContext.name}".`);
      }

      return attributeObj.name + '=' + attributeType.stringify(output, attributeObj);
    });

    return output + attributeStrings.join(',');
  }
}

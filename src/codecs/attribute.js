const attributeCodecFactory = (typeContext) => {
  return {
    parse: (output, str) => {
      let currentStr = str;
      const attributes = output.value || (output.value = {});

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
        let attributeType = typeContext.attributes.get(attributeName) || typeContext.attributes.get('UNKNOWN-ATTRIBUTE');

        if (!attributeType) {
          throw new Error(`Attribute "${attributeName}" not allowed on tag "${typeContext.name}".`);
        }

        // create a new attribute object
        attributes[attributeName] = attributeType.createInstance();

        // get attribute value
        const charsConsumed = attributeType.parse(attributes[attributeName], currentStr);

        // str.slice(attribute name length)
        currentStr = currentStr.slice(charsConsumed + 1);
      }
    },
    stringify: (output, obj) => {
      const attributes = obj.value;

      if (!attributes) {
        return output;
      }

      const attributeProperties = Object.keys(attributes);
      const attributeStrings = attributeProperties.map((attributeProperty) => {
        const attributeValue = attributes[attributeProperty];
        // look-up type
        const attributeType = typeContext.attributes.get(attributeValue.name);

        if (!attributeType) {
          throw new Error(`Attribute "${attributeProperty}" not allowed on tag "${typeContext.name}".`);
        }

        return attributeProperty + '=' + attributeType.stringify(output, attributeValue);
      });

      return output + attributeStrings.join(',');
    }
  };
};

export default attributeCodecFactory;

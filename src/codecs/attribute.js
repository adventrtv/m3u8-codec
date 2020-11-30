const attributeCodec = (typeContext) => {
  return {
    parse: (output, str) => {
      let currentStr = str;
      const attributes = output.value || (output.value = {});

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
        let attributeType = typeContext.attributes.get(attributeName);

        if (!attributeType) {
          throw new Error(`Attribute "${attributeName}" not allowed on tag "${typeContext.name}".`);
        }

        // create a new attribute object
        attributes[attributeName] = attributeType.createInstance();

        // get attribute value
        const [attributeValue, charsConsumed] = attributeType.parse(attributes[attributeName], currentStr);

        // str.slice(attribute name length)
        currentStr = currentStr.slice(charsConsumed + 1);
      }
    },
    stringify: (output, obj) => {
      const attributes = obj.value;

      if (!attributes) {
        return output;
      }

      const attributeNames = Object.keys(attributes);
      const attributeStrings = attributeNames.map((attributeName) => {
        const attributeValue = attributes[attributeName];
        // look-up type
        const attributeType = typeContext.attributes.get(attributeName);

        if (!attributeType) {
          throw new Error(`Attribute "${attributeName}" not allowed on tag "${typeContext.name}".`);
        }

        return attributeName + '=' + attributeType.stringify(output, attributeValue);
      });

      return output + attributeStrings.join(',');
    }
  };
};

export default attributeCodec;

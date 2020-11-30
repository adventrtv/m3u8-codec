// Build a new instance of tag
// Tags copy most of the properties from the tagSpec but are missing the
// parse and stringify functions AND attribute specs
const baseProperties = [
  'name', 'type',
  'playlistType', 'appliesToNextUri',
//  'default', 'allowed', 'required',
  'minVersion', 'maxVersion'
];

// const funcProperties = ['parse', 'stringify'];
const createBaseInstance = (tag) => (options = { verbose: false }) => {
  const newTag = {};

  // copy base properties
  baseProperties.forEach((prop) => {
    if (tag[prop] !== undefined) {
      newTag[prop] = tag[prop];
    }
  });

  newTag.value = null;

  return newTag;
};

const createTagInstance = (tag) => {
  const createInstance = createBaseInstance(tag);

  return (options = { verbose: false }) => {
    const newTag = createInstance(options);

    if (tag.attributes) {
      tag.attributes.forEach((attribute) => {
        if (attribute.default !== undefined) {
          const attrInstance = attribute.createInstance();

          attrInstance.value = attribute.default;

          if (!newTag.value) {
            newTag.value = {
              [attribute.name]: attrInstance
            };
          }

          newTag.value[attribute.name] = attrInstance;
        }
      });
    }

    return newTag;
  };
};

const generateTagMapElement = (typeSpec) => {
  const attributeElementGenerator = (attrType) => {
    if (attrType.type !== null) {
      const attrCodec = typeSpec[attrType.type](attrType);

      attrType.parse = attrCodec.parse;
      attrType.stringify = attrCodec.stringify;
    }
    attrType.createInstance = createBaseInstance(attrType);

    return [attrType.name, attrType];
  };

  return (tagType) => {
    const tagObject = Object.assign({}, tagType);
    const attrTypes = tagType.attributes;

    if (tagType.type !== null) {
      const tagCodec = typeSpec[tagType.type](tagObject);

      tagObject.parse = tagCodec.parse;
      tagObject.stringify = tagCodec.stringify;
    }
    tagObject.createInstance = createTagInstance(tagObject);

    if (attrTypes) {
      tagObject.attributes = new Map(attrTypes.map(attributeElementGenerator));

      const attrs = tagObject.attributes;

      tagObject.setCustomAttribute = (newAttributeSpec) => attrs.set.apply(attrs, attributeElementGenerator(newAttributeSpec));
    }

    return [tagType.name, tagObject];
  };
};

const buildCodec = (tagSpec, typeSpec) => {
  const defaultTagMapElementGenerator = generateTagMapElement(typeSpec);
  // Build O(1) lookup table(s) from spec
  const tagsSpec = new Map(tagSpec.map(defaultTagMapElementGenerator));

  const parseTag = (input) => {
    let tagName = input;
    let firstColon = input.indexOf(':');
    let tagValue = '';

    if (firstColon !== -1) {
      tagName = input.slice(0, firstColon);
      tagValue = input.slice(firstColon + 1);
    }

    const tagSpec = tagsSpec.get(tagName);

    if (!tagSpec) {
      throw new Error(`Found unknown tag "${tagName}".`);
    }

    const output = tagSpec.createInstance();

    if (tagSpec.type === null && tagValue !== '') {
      throw new Error(`Tag "${tagSpec.name}" has no value but found "${tagValue}".`);
    }

    if (tagSpec.type !== null && tagValue === '') {
      throw new Error(`Tag "${tagSpec.name}" has attributes but none were found.`);
    }

    if (tagValue !== '') {
      tagSpec.parse(output, tagValue);
    }

    return output;
  };

  const serializeTag = (lineObj) => {
    const tagSpec = tagsSpec.get(lineObj.name);

    if (tagSpec.type !== null) {
      let valueString = tagSpec.stringify('', lineObj);

      return `${lineObj.name}:${valueString}`;
    }

    return `${lineObj.name}`;
  };

  const setCustomTag = (newTagSpec, newTypeSpec = null) => {
    let localTagMapElementGenerator = defaultTagMapElementGenerator;
    if (newTypeSpec) {
      localTagMapElementGenerator = generateTagMapElement(newTypeSpec);
    }
    tagsSpec.set.apply(tagsSpec, localTagMapElementGenerator(newTagSpec));
  };

  return {
    parse: (lineStr) => {
      if (lineStr.indexOf('#EXT') === 0) {
        // Found a tag!
        const lineObj = parseTag(lineStr);

        lineObj.lineType = 'tag';

        return lineObj;
      } else if (lineStr.indexOf('#') === 0) {
        // Found a comment!
        return {
          lineType: 'comment',
          value: lineStr
        };
      } else if (lineStr.length === 0) {
        // Empty line
        return {
          lineType: 'empty',
        };
      } else {
        // URI!
        return {
          lineType: 'uri',
          value: lineStr
        };
      }

      return lineObj;
    },
    stringify: (lineObj) => {
      let str;

      switch(lineObj.lineType) {
        case 'tag': {
          str = serializeTag(lineObj);
          break;
        }
        case 'empty': {
          str = '';
          break;
        }
        default: {
          str = lineObj.value;
          break;
        }
      }

      return str;
    },
    setCustomTag,
    getTag: (tagName) => tagsSpec.get(tagName)
  };
};

export default buildCodec;

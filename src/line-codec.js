import { tagSpec, typeSpec } from './hls-spec.js';

// Build a new instance of tag
// Tags copy most of the properties from the tagSpec but are missing the
// parse and stringify functions AND attribute specs
const baseProperties = [
  'name', 'type',
  'playlistType', 'appliesToNextUri',
  // 'default', 'allowed', 'required',
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
            newTag.value = [ attrInstance ];
          } else {
            newTag.value.push(attrInstance);
          }
        }
      });
    }

    return newTag;
  };
};

const generateTagMapElement = (typeSpec) => {
  const attributeElementGenerator = (parentTag) => (attrType) => {
    if (attrType.type !== null) {
      const AttrTypeSpec = typeSpec[attrType.type];

      if (!AttrTypeSpec) {
        throw new Error(`Tag "${parentTag.name}" defines an attribute "${attrType.name}" which declares unknown type "${attrType.type}"`);
      }

      const attrCodec = new AttrTypeSpec(attrType);

      attrType.parse = (...args) => attrCodec.parse(...args);
      attrType.stringify = (...args) => attrCodec.stringify(...args);
    }
    attrType.createInstance = createBaseInstance(attrType);

    return [attrType.name, attrType];
  };

  return (tagType) => {
    const tagObject = Object.assign({}, tagType);
    const attrTypes = tagType.attributes;

    if (tagType.type !== null) {
      const TagTypeSpec = typeSpec[tagType.type];

      if (!TagTypeSpec) {
        throw new Error(`Tag "${tagType.name}" declares unknown type "${tagType.type}"`);
      }

      const tagCodec = new TagTypeSpec(tagObject);

      tagObject.parse = (...args) => tagCodec.parse(...args);
      tagObject.stringify = (...args) => tagCodec.stringify(...args);
    }
    tagObject.createInstance = createTagInstance(tagObject);

    if (attrTypes) {
      const mapAttributes = attributeElementGenerator(tagType);

      tagObject.attributes = new Map(attrTypes.map(mapAttributes));

      // We always add the "fuzzy type" matcher
      tagObject.attributes.set(...attributeElementGenerator(tagType)({ name: 'UNKNOWN-ATTRIBUTE', type: '<unknown-type>' }));

      const attrs = tagObject.attributes;

      tagObject.setCustomAttribute = (newAttributeSpec) => attrs.set(...attributeElementGenerator(newAttributeSpec));
    }

    return [tagType.name, tagObject];
  };
};

export default class LineCodec {
  #localTypeSpec;
  #defaultTagMapElementGenerator;
  #tagSpecMap;
  #parseTag;
  #serializeTag;

  constructor (mainTagSpec = tagSpec, mainTypeSpec = typeSpec) {
    this.#localTypeSpec = Object.create(mainTypeSpec);
    this.#defaultTagMapElementGenerator = generateTagMapElement(this.#localTypeSpec);
    // Build O(1) lookup table(s) from spec
    this.#tagSpecMap = new Map(mainTagSpec.map(this.#defaultTagMapElementGenerator));

    this.#parseTag = (input) => {
      let tagName = input;
      const firstColon = input.indexOf(':');
      let tagValue = '';

      if (firstColon !== -1) {
        tagName = input.slice(0, firstColon);
        tagValue = input.slice(firstColon + 1);
      }

      const tagSpec = this.#tagSpecMap.get(tagName);

      if (!tagSpec) {
        return {
          lineType: 'comment',
          value: input
        };
        // throw new Error(`Found unknown tag "${tagName}".`);
      }

      const output = tagSpec.createInstance();

      // TODO: Stop special-casing type null?
      if (tagSpec.type === null && tagValue !== '') {
        throw new Error(`Tag "${tagSpec.name}" has no value but found "${tagValue}".`);
      }

      if (tagSpec.type !== null && tagValue === '') {
        throw new Error(`Tag "${tagSpec.name}" has a value but none were found.`);
      }

      if (tagValue !== '') {
        tagSpec.parse(output, tagValue);
      }

      output.lineType = 'tag';

      return output;
    };


    this.#serializeTag = (lineObj) => {
      const tagSpec = this.#tagSpecMap.get(lineObj.name);

      // TODO: Stop special-casing type null?
      if (tagSpec.type !== null) {
        const valueString = tagSpec.stringify('', lineObj);

        return `${lineObj.name}:${valueString}`;
      }

      return `${lineObj.name}`;
    };
  }

  setCustomTag(newTagSpec, newTypeSpec = null) {
    let localTagMapElementGenerator = this.#defaultTagMapElementGenerator;

    if (newTypeSpec) {
      localTagMapElementGenerator = generateTagMapElement(newTypeSpec);
    }

    this.#tagSpecMap.set(...localTagMapElementGenerator(newTagSpec));
  }

  setCustomType (newTypeName, newTypeSpec) {
    this.#localTypeSpec[newTypeName] = newTypeSpec;
  }

  getTag(tagName) {
    return this.#tagSpecMap.get(tagName);
  }

  parse(lineStr) {
    if (lineStr.indexOf('#') === 0) {
      // Found a tag or comment!
      return this.#parseTag(lineStr);
    } else if (lineStr.trim().length === 0) {
      // Empty line
      return {
        lineType: 'empty'
      };
    }
    // URI!
    return {
      lineType: 'uri',
      value: lineStr.trim()
    };
  }

  stringify(lineObj) {
    let str;

    switch (lineObj.lineType) {
    case 'tag':
      str = this.#serializeTag(lineObj);
      break;
    case 'empty':
      str = '';
      break;
    default:
      str = lineObj.value;
      break;
    }

    return str;
  }
};

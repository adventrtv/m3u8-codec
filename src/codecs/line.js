import { tagSpec, typeSpec } from '../hls.js';
import { IdentityType } from '../types/regexp-types.js';
import CastingMixin from '../types/casting-mixin.js';
import NamedPropertyMixin from '../types/named-property-mixin.js';
import { identity, uriCast } from '../types/type-casts.js';

// Build a new instance of tag
// Tags copy most of the properties from the tagSpec but are missing the
// parse and stringify functions AND attribute specs
const baseProperties = [
  'name', 'type',
  'playlistType', 'appliesToNextUri', 'isCustom',
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

  if (baseProperties.type) {
    newTag.value = null;
  }

  return newTag;
};

const noop = ()=>{};

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

const generateTagMapElement = (typeSpecData) => {
  const attributeElementGenerator = (parentTag) => (attrType) => {
    if (attrType.type) {
      const AttrTypeSpec = typeSpecData[attrType.type];

      if (!AttrTypeSpec) {
        throw new Error(`Tag "${parentTag.name}" defines an attribute "${attrType.name}" which declares unknown type "${attrType.type}"`);
      }

      const attrCodec = new AttrTypeSpec(attrType);

      attrType.parse = (...args) => attrCodec.parse(...args);
      attrType.stringify = (...args) => attrCodec.stringify(...args);
    } else {
      attrType.parse = noop;
      attrType.stringify = noop;
    }

    attrType.createInstance = createBaseInstance(attrType);

    return [attrType.name, attrType];
  };

  return (tagType) => {
    const tagObject = Object.assign({}, tagType);
    const attrTypes = tagType.attributes;

    if (tagType.type) {
      const TagTypeSpec = typeSpecData[tagType.type];

      if (!TagTypeSpec) {
        throw new Error(`Tag "${tagType.name}" declares unknown type "${tagType.type}"`);
      }

      const tagCodec = new TagTypeSpec(tagObject);

      tagObject.parse = (...args) => tagCodec.parse(...args);

      if (tagType.noTagNamePrefix) {
        tagObject.stringify = (...args) => tagCodec.stringify(...args);
      } else {
        tagObject.stringify = (...args) => `${tagObject.name}:${tagCodec.stringify(...args)}`;
      }
    } else {
      tagObject.parse = noop;
      tagObject.stringify = (...args) => `${tagObject.name}`;
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

  constructor(mainTagSpec = tagSpec, mainTypeSpec = typeSpec) {
    const tempTagSpec = [...mainTagSpec,
      // SPECIAL TAGS
      {
        name: 'comment',
        type: '<comment-line>',
        playlistType: 'both',
        description: 'A comment.',
        noTagNamePrefix: true
      }, {
        name: 'empty',
        type: '<empty-line>',
        playlistType: 'both',
        description: 'An empty line',
        noTagNamePrefix: true
      }, {
        name: 'uri',
        type: '<uri-line>',
        playlistType: 'both',
        description: 'A URI',
        noTagNamePrefix: true
      }
    ];
    this.#localTypeSpec = {...mainTypeSpec,
      '<comment-line>': NamedPropertyMixin(CastingMixin(IdentityType, [identity]), ['value']),
      '<empty-line>': NamedPropertyMixin(CastingMixin(IdentityType, [identity]), ['value']),
      '<uri-line>': NamedPropertyMixin(CastingMixin(IdentityType, [uriCast]), ['value'])
    };

    this.#defaultTagMapElementGenerator = generateTagMapElement(this.#localTypeSpec);
    // Build O(1) lookup table(s) from spec
    this.#tagSpecMap = new Map(tempTagSpec.map(this.#defaultTagMapElementGenerator));

    this.#parseTag = (input) => {
      const trimmedInput = input.trim();

      if (trimmedInput.length === 0) {
        // We found an empty-line!
        const outputTagSpec = this.#tagSpecMap.get('empty')
        const outputTag = outputTagSpec.createInstance();
        outputTagSpec.parse(outputTag, input);

        return outputTag;
      }

      const hasHash = input.indexOf('#') === 0;

      if (!hasHash) {
        // Consider this case a uri-line
        // TODO: Validation?
        const outputTagSpec = this.#tagSpecMap.get('uri');
        const outputTag = outputTagSpec.createInstance();
        outputTagSpec.parse(outputTag, input);

        return outputTag;
      }

      const firstColon = input.indexOf(':');

      let tagName = input;

      let tagValue = '';

      if (firstColon !== -1) {
        tagName = input.slice(0, firstColon);
        tagValue = input.slice(firstColon + 1);
      }
      let tagSpecData = this.#tagSpecMap.get(tagName);

      if (!tagSpecData) {
        // OK, it's almost certainly a comment or an unknown tag which we treat as a comment
        tagName = 'comment';
        tagValue = input;
        tagSpecData = this.#tagSpecMap.get(tagName);
      }

      if (tagSpecData.type && tagValue === '') {
        throw new Error(`Tag "${tagSpecData.name}" has a value but none were found.`);
      } else if (!tagSpecData.type && tagValue !== '') {
        throw new Error(`Tag "${tagSpecData.name}" has no value but found "${tagValue}".`);
      }

      if (!tagSpecData) {
        throw new Error(`Found unknown tag "${tagName}".`);
      }

      const output = tagSpecData.createInstance();

      tagSpecData.parse(output, tagValue);

      return output;
    };

    this.#serializeTag = (lineObj) => {
      const tagSpecData = this.#tagSpecMap.get(lineObj.name);
      if (tagSpecData === undefined) console.log(lineObj);

      return tagSpecData.stringify(lineObj);
    };
  }

  setCustomTag(newTagSpec, newTypeSpec = null) {
    let localTagMapElementGenerator = this.#defaultTagMapElementGenerator;

    if (newTypeSpec) {
      localTagMapElementGenerator = generateTagMapElement(newTypeSpec);
    }

    this.#tagSpecMap.set(...localTagMapElementGenerator({
      playlistType: 'both',
      isCustom: true,
      ...newTagSpec
    }));
  }

  setCustomType(newTypeName, newTypeSpec) {
    this.#localTypeSpec[newTypeName] = newTypeSpec;
  }

  getTag(tagName) {
    return this.#tagSpecMap.get(tagName);
  }

  parse(lineStr) {
    return this.#parseTag(lineStr);
  }

  stringify(lineObj) {
    if (!lineObj) {
      return;
    }
    return this.#serializeTag(lineObj);
  }
}

import M3U8NestedCodec from './m3u8-nested.js';
import { setProperty } from '../helpers/props.js';

import CastingMixin from '../types/casting-mixin.js';
import NamedPropertyMixin from '../types/named-property-mixin.js';
import { IdentityType } from '../types/regexp-types.js';

import { numberCast } from '../types/type-casts.js';

const camelCaseIt = (str) => str.toLowerCase().replace(/-([a-z])/g, (m) => m[1].toUpperCase());
const camelCaseTag = (str) => camelCaseIt(str.replace('#', ''));
const unCamelCaseIt = (str) => str.replace(/([A-Z])/g, (m) => '-' + m[0]).toUpperCase();
const unCamelCaseTag = (str) => '#' + unCamelCaseIt(str);
const findAttr = (tag, attrName) => tag?.value.find(a => a.name === attrName);

const createTagFactory = (videoJsCodec) => {
  const tagFactory = (tagName, typeOverride) => {
    const tagType = videoJsCodec.getTag(tagName);
    const tag = tagType.createInstance();

    if (typeOverride) {
      tag.type = typeOverride;
    }

    return tag;
  };

  tagFactory.createAttribute = (tagName, attributeName, typeOverride) => {
    const tagType = videoJsCodec.getTag(tagName);
    const attr = tagType.attributes.get(attributeName).createInstance();

    if (typeOverride) {
      attr.type = typeOverride;
    }

    return attr;
  };

  return tagFactory;
};

const toGlobalTags = (globals) => {
  const output = {
    allowCache: true,
    discontinuityStarts: [],
    segments: []
  };

  globals.forEach((tag) => {
    switch (tag.name) {
    case '#EXT-X-VERSION':
      output.version = tag.value;
      break;
    case '#EXT-X-TARGETDURATION':
      output.targetDuration = tag.value;
      break;
    case '#EXT-X-MEDIA-SEQUENCE':
      output.mediaSequence = tag.value;
      break;
    case '#EXT-X-DISCONTINUITY-SEQUENCE':
      output.discontinuitySequence = tag.value;
      break;
    case '#EXT-X-ENDLIST':
      output.endList = true;
      break;
    case '#EXT-X-PLAYLIST-TYPE':
      output.playlistType = tag.value;
      break;
    case '#EXT-X-ALLOW-CACHE':
      output.allowCache = tag.value === 'YES';
      break;
    case '#EXT-X-I-FRAMES-ONLY':
      // TODO: figure out how to handle this one
      break;
    case '#EXT-X-START':
      output.start = {
        timeOffset: findAttr(tag, 'TIME-OFFSET')?.value,
        precise: findAttr(tag, 'PRECISE')?.value === 'YES'
      };
      break;
    case 'comment':
      if (!output.comments) {
        output.comments = [];
      }
      output.comments.push(tag.value);
      break;
    }
    if (tag.isCustom) {
      setProperty(output, ['custom', camelCaseTag(tag.name)], tag.value);
    }
  });

  return output;
};

const fromGlobalTags = (createTag, videojsObj) => {
  const output = {
    globals: [
      createTag('#EXTM3U')
    ]
  };

  const mapping = [
    ['#EXT-X-VERSION', videojsObj.version],
    ['#EXT-X-TARGETDURATION', videojsObj.targetDuration],
    ['#EXT-X-MEDIA-SEQUENCE', videojsObj.mediaSequence],
    ['#EXT-X-DISCONTINUITY-SEQUENCE', videojsObj.discontinuitySequence],
    ['#EXT-X-PLAYLIST-TYPE', videojsObj.playlistType],
    ['#EXT-X-ALLOW-CACHE', videojsObj.allowCache ? 'YES' : 'NO']
    // TODO: figure out how to handle this one
    // ['#EXT-X-I-FRAMES-ONLY', videojsObj.iframeOnly],
  ];

  if (videojsObj.endList) {
    mapping.push(['#EXT-X-ENDLIST', null]);
  }

  if (videojsObj.comments) {
    videojsObj.comments.forEach((comment) => {
      const tag = createTag('comment');

      tag.value = comment;
      output.globals.push(tag);
    });
  }

  if (videojsObj.start) {
    const tag = createTag('#EXT-X-START');

    let attr = createTag.createAttribute('#EXT-X-START', 'TIME-OFFSET');

    attr.value = videojsObj.start.timeOffset;
    tag.value = [attr];

    if (videojsObj.start.precise) {
      attr = createTag.createAttribute('#EXT-X-START', 'PRECISE');

      attr.value = 'YES';
      tag.value.push(attr);
    }
    output.globals.push(tag);
  }

  mapping.forEach((map) => {
    const [name, value] = map;

    if (value !== undefined) {
      const tag = createTag(name);

      if (value !== null) {
        tag.value = value;
      }
      output.globals.push(tag);
    }
  });

  if (videojsObj.custom) {
    const customNames = Object.keys(videojsObj.custom);

    customNames.forEach((customName) => {
      const cust = createTag(unCamelCaseTag(customName));

      cust.value = videojsObj.custom[customName];
      output.globals.push(cust);
    });
  }

  return output;
};

const booleanAttr = ['DEFAULT', 'AUTOSELECT', 'FORCED'];

const toMediaGroups = (videojsObj, globals) => {
  const mediaGroupAttr = ['DEFAULT', 'AUTOSELECT', 'FORCED', 'LANGUAGE', 'URI', 'INSTREAM-ID'];

  videojsObj.mediaGroups = videojsObj.mediaGroups || {
    'VIDEO': {},
    'AUDIO': {},
    'CLOSED-CAPTIONS': {},
    'SUBTITLES': {}
  };

  const mediaGroups = videojsObj.mediaGroups;

  globals.forEach((tag) => {
    if (tag.name === '#EXT-X-MEDIA') {
      const objType = findAttr(tag, 'TYPE')?.value;
      const objGroupId = findAttr(tag, 'GROUP-ID')?.value;
      const objName = findAttr(tag, 'NAME')?.value;

      mediaGroupAttr.forEach((attr) => {
        let value = findAttr(tag, attr)?.value;

        if (value === undefined || value === null) {
          return;
        }

        if (booleanAttr.indexOf(attr) !== -1) {
          value = value === 'YES';
        }

        // Set each property on path <TYPE>.<GROUP-ID>.<NAME>.<attributeName>
        setProperty(mediaGroups, [objType, objGroupId, objName, camelCaseIt(attr)], value);
      });
    }
  });
};

const fromMediaGroups = (createTag, output, videojsObj) => {
  if (!videojsObj.mediaGroups) {
    return;
  }

  const mediaGroups = videojsObj.mediaGroups;
  const types = ['VIDEO', 'AUDIO', 'CLOSED-CAPTIONS', 'SUBTITLES'];

  types.forEach((mediaGroupType) => {
    const mediaGroup = mediaGroups[mediaGroupType];
    const groupIds = Object.keys(mediaGroup);

    if (!groupIds.length) {
      return;
    }

    groupIds.forEach((groupId) => {
      const group = mediaGroup[groupId];
      const names = Object.keys(group);

      if (!names.length) {
        return;
      }

      names.forEach((name) => {
        const attributes = group[name];
        const attributeNames = Object.keys(attributes);
        const tag = createTag('#EXT-X-MEDIA');

        tag.value = [
          createTag.createAttribute('#EXT-X-MEDIA', 'NAME'),
          createTag.createAttribute('#EXT-X-MEDIA', 'GROUP-ID'),
          createTag.createAttribute('#EXT-X-MEDIA', 'TYPE')
        ];
        tag.value[0].value = name;
        tag.value[1].value = groupId;
        tag.value[2].value = mediaGroupType;

        if (!attributeNames.length) {
          return;
        }

        attributeNames.forEach((attributeName) => {
          const attribute = unCamelCaseIt(attributeName);
          const value = attributes[attributeName];
          const attr = createTag.createAttribute('#EXT-X-MEDIA', attribute);

          attr.value = value;

          if (booleanAttr.indexOf(attribute) !== -1) {
            attr.value = attr.value ? 'YES' : 'NO';
          }
          tag.value.push(attr);
        });

        output.globals.push(tag);
      });
    });
  });
};

// These are <decimal-integer> or <decimal-floating-point>
// properties that the old video.js parser dumbly kept as strings.
// Now we have to un-cast them back to strings stay compatible.
const dumbStringProperties = ['AVERAGE-BANDWIDTH', 'FRAME-RATE'];

const toPlaylists = (videojsObj, playlists) => {
  videojsObj.playlists = videojsObj.playlists || [];

  const output = videojsObj.playlists;

  if (!playlists) {
    return output;
  }

  playlists.forEach((playlistArr) => {
    const currentObj = {
      timeline: 0
    };

    playlistArr.forEach((tag) => {
      if (tag.name === 'uri') {
        currentObj.uri = tag.value;
        return;
      }
      switch (tag.name) {
      case '#EXT-X-STREAM-INF':
        currentObj.attributes = {};

        tag.value.forEach((attribute) => {
          if (dumbStringProperties.indexOf(attribute.name) !== -1) {
            currentObj.attributes[attribute.name] = attribute.value + '';
          } else {
            currentObj.attributes[attribute.name] = attribute.value;
          }
        });
        break;
      case '#EXT-X-I-FRAME-STREAM-INF':
        // TODO: Support #EXT-X-I-FRAME-STREAM-INF
        break;
      }
    });

    output.push(currentObj);
  });
};

const fromPlaylists = (createTag, output, videojsObj) => {
  const playlists = videojsObj.playlists;

  if (!playlists && !playlists.length) {
    return;
  }

  output.playlists = [];

  playlists.forEach((playlistEntry) => {
    const streamInf = createTag('#EXT-X-STREAM-INF');
    const attributeNames = Object.keys(playlistEntry.attributes);

    streamInf.value = [];
    attributeNames.forEach((attributeName) => {
      const attr = createTag.createAttribute('#EXT-X-STREAM-INF', attributeName);

      if (dumbStringProperties.indexOf(attributeName) !== -1) {
        attr.value = parseFloat(playlistEntry.attributes[attributeName]);
      } else {
        attr.value = playlistEntry.attributes[attributeName];
      }
      streamInf.value.push(attr);
    });
    const uriObj = createTag('uri');

    uriObj.value = playlistEntry.uri;
    output.playlists.push(streamInf);
    output.playlists.push(uriObj);
  });
};

const isBigEndian = () => {
  const arrayBuffer = new ArrayBuffer(2);
  const uint8Array = new Uint8Array(arrayBuffer);
  const uint16array = new Uint16Array(arrayBuffer);

  // byte 1
  uint8Array[0] = 0x12;
  // byte 2
  uint8Array[1] = 0x34;

  if (uint16array[0] === 0x1234) {
    return true;
  }

  return false;
};

const switchEndianness = (buffer) => {
  if (isBigEndian()) {
    return buffer;
  }

  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const output = new Uint8Array(len);

  for (let i = 0; i < len; i += 4) {
    output[i + 3] = bytes[i];
    output[i + 2] = bytes[i + 1];
    output[i + 1] = bytes[i + 2];
    output[i] = bytes[i + 3];
  }

  return output.buffer;
};

const toSegments = (videojsObj, segments) => {
  videojsObj.segments = videojsObj.segments || [];
  videojsObj.discontinuityStarts = videojsObj.discontinuityStarts || [];

  const output = videojsObj.segments;
  const discoStarts = videojsObj.discontinuityStarts;

  let currentDisco = videojsObj.discontinuitySequence || 0;

  if (!segments) {
    return output;
  }

  segments.forEach((segmentArr) => {
    const last = output[output.length - 1];
    const currentObj = {
      timeline: currentDisco
    };

    // These are both values that are "sticky" - once defined on a segment
    // they will apply to all future segments until new values are declared
    if (last && last.key) {
      currentObj.key = last.key;
    }
    if (last && last.map) {
      currentObj.map = last.map;
    }

    // This is objectively wrong but video.js does it...
    currentObj.duration = videojsObj.targetDuration;

    segmentArr.forEach((tag) => {
      if (tag.name === 'uri') {
        currentObj.uri = tag.value;
        return;
      }

      switch (tag.name) {
      case '#EXTINF':
        if (!isNaN(tag.value.duration)) {
          currentObj.duration = tag.value.duration;
        }
        // Video.js doesn't seem to do anything with the `title` attribute??
        // if (tag.value.title && tag.value.title.length) {
        //   currentObj.title = tag.value.title;
        // }
        break;
      case '#EXT-X-BYTERANGE':
        currentObj.byterange = tag.value;

        // It's possible for the offset to be missing in which case, it's calculated
        if (isNaN(currentObj.byterange.offset)) {
          currentObj.byterange.offset = last.byterange.offset + last.byterange.length;
        }
        break;
      case '#EXT-X-DISCONTINUITY':
        currentObj.discontinuity = true;
        currentObj.timeline = ++currentDisco;
        discoStarts.push(output.length);
        break;
      case '#EXT-X-KEY':
        currentObj.key = {};
        const method = findAttr(tag, 'METHOD')?.value;
        const uri = findAttr(tag, 'URI')?.value;
        const iv = findAttr(tag, 'IV')?.value;

        if (method) {
          if (method === 'NONE') {
            delete currentObj.key;
            return;
          }
          currentObj.key.method = method;
        }
        if (uri) {
          currentObj.key.uri = uri;
        }
        if (iv) {
          currentObj.key.iv = new Uint32Array(switchEndianness(iv));
        }
        break;
      case '#EXT-X-MAP':
        currentObj.map = {
          byterange: findAttr(tag, 'BYTERANGE')?.value,
          uri: findAttr(tag, 'URI')?.value
        };
        break;
      case '#EXT-X-PROGRAM-DATE-TIME':
        // Why does video.js store two copies of the same value?
        // No one knows!
        currentObj.dateTimeString = tag.value.toISOString();
        currentObj.dateTimeObject = tag.value;

        // We also set the "global" dateTime values to the very first PDT we encounter
        if (!videojsObj.dateTimeString) {
          videojsObj.dateTimeString = tag.value.toISOString();
          videojsObj.dateTimeObject = tag.value;
        }
        break;
      case '#EXT-X-DATERANGE':
        // TODO: Figure out what this should look like...
        /*
          currentObj.dateRanges = {
            id: {
              startTime,
              class?,
              endDate?,
              duration?,
              plannedDuration?,
              endOnNext?,
              scte35Cmd?,
              scte35Out?,
              scte35In?,
              clientAttributes?: {
              }
            }
          };
        */
        break;
      case '#EXT-X-CUE-OUT':
        currentObj.cueOut = tag.value;
        break;
      case '#EXT-X-CUE-OUT-CONT':
        currentObj.cueOutCont = `${tag.value.seconds}/${tag.value.totalDuration}`;
        break;
      case '#EXT-X-CUE-IN':
        currentObj.cueIn = true;
        break;
      case 'comment':
        const comments = currentObj.comments || (currentObj.comments = []);

        comments.push(tag.value);
        break;
      default:
        if (tag.isCustom) {
          setProperty(currentObj, ['custom', camelCaseTag(tag.name)], tag.value);
        }
        break;
      }
    });

    output.push(currentObj);
  });
};

const keyEquals = (keyA, keyB) => keyA.uri === keyB.uri && keyA.method === keyB.method && keyA.iv === keyB.iv;

const fromSegments = (createTag, output, videojsObj) => {
  const segments = videojsObj.segments;

  if (!segments && !segments.length) {
    return;
  }
  output.segments = [];

  let previousKey;

  segments.forEach((segmentEntry) => {
    const segmentArr = [];

    if (Array.isArray(segmentEntry.comments)) {
      segmentEntry.comments.forEach((comment) => {
        const tag = createTag('comment');

        tag.value = comment;
        segmentArr.push(tag);
      });
    }

    if (segmentEntry) {
      const tag = createTag('#EXTINF');

      tag.value = { duration: segmentEntry.duration };
      segmentArr.push(tag);
    }

    if (segmentEntry.byterange) {
      const tag = createTag('#EXT-X-BYTERANGE');

      tag.value = segmentEntry.byterange;
      segmentArr.push(tag);
    }

    if (segmentEntry.discontinuity) {
      const tag = createTag('#EXT-X-DISCONTINUITY');

      segmentArr.push(tag);
    }

    if (previousKey || segmentEntry.key) {
      // This means that there is a previously set encryption key BUT the
      // current segment lacks one so we must set METHOD=NONE
      if (!segmentEntry.key) {
        const tag = createTag('#EXT-X-KEY');

        previousKey = null;
        const attr = createTag.createAttribute('#EXT-X-KEY', 'METHOD');

        attr.value = 'NONE';
        tag.value = [attr];

        segmentArr.push(tag);
      } else if (!previousKey || !keyEquals(previousKey, segmentEntry.key)) {
        const tag = createTag('#EXT-X-KEY');

        previousKey = segmentEntry.key;

        let attr = createTag.createAttribute('#EXT-X-KEY', 'METHOD');

        attr.value = segmentEntry.key.method;
        tag.value = [attr];

        if (segmentEntry.key?.iv) {
          attr = createTag.createAttribute('#EXT-X-KEY', 'IV');
          attr.value = switchEndianness(segmentEntry.key.iv.buffer);
          tag.value.push(attr);
        }

        if (segmentEntry.key?.uri) {
          attr = createTag.createAttribute('#EXT-X-KEY', 'URI');
          attr.value = segmentEntry.key.uri;
          tag.value.push(attr);
        }

        segmentArr.push(tag);
      }
    }

    if (segmentEntry.map) {
      const tag = createTag('#EXT-X-MAP');

      tag.value = [];

      let attr = createTag.createAttribute('#EXT-X-MAP', 'BYTERANGE');

      attr.value = segmentEntry.map.byterange;
      tag.value = [attr];

      attr = createTag.createAttribute('#EXT-X-MAP', 'URI');
      attr.value = segmentEntry.map.uri;
      tag.value.push(attr);

      segmentArr.push(tag);
    }

    if (segmentEntry.dateTimeObject) {
      const tag = createTag('#EXT-X-PROGRAM-DATE-TIME');

      tag.value = segmentEntry.dateTimeObject;
      segmentArr.push(tag);
    }

    // TODO: Figure out what this should look like...
    if (segmentEntry.dateRange) {
      // const tag = createTag('#EXT-X-DATERANGE');
    }

    if (segmentEntry.custom) {
      const customNames = Object.keys(segmentEntry.custom);

      customNames.forEach((customName) => {
        const cust = createTag(unCamelCaseTag(customName));

        cust.value = segmentEntry.custom[customName];
        segmentArr.push(cust);
      });
    }

    if (segmentEntry.cueOut) {
      const tag = createTag('#EXT-X-CUE-OUT');

      tag.value = segmentEntry.cueOut;
      segmentArr.push(tag);
    }

    if (segmentEntry.cueInOut) {
      const tag = createTag('#EXT-X-CUE-IN-OUT');

      tag.value = {
        seconds: parseFloat(segmentEntry.cueInOut),
        totalDuration: parseFloat(segmentEntry.cueInOut.replace(/\d+\//, ''))
      };
      segmentArr.push(tag);
    }

    if (segmentEntry.cueIn) {
      const tag = createTag('#EXT-X-CUE-IN');

      segmentArr.push(tag);
    }

    const uriObj = createTag('uri');

    uriObj.value = segmentEntry.uri;
    segmentArr.push(uriObj);

    output.segments.push(segmentArr);
  });
};

class CueOutCont extends IdentityType {
  regexp = /^([0-9]+.?[0-9]*)\/([0-9]+.?[0-9]*)/;

  stringify(justMatches) {
    return `${justMatches[0]}/${justMatches[1]}`;
  }
}

export default class VideojsCodec extends M3U8NestedCodec {
  constructor(mainTagSpec, mainTypeSpec) {
    super(mainTagSpec, mainTypeSpec);

    // The videojs parser supports some odd tag-types
    this.setCustomTag({
      name: '#EXT-X-CUE-IN',
      playlistType: 'media',
      appliesToNextUri: true,
      isCustom: false
    });

    this.setCustomTag({
      name: '#EXT-X-CUE-OUT',
      type: '<decimal-floating-point>',
      playlistType: 'media',
      appliesToNextUri: true,
      isCustom: false
    });

    this.setCustomTag({
      name: '#EXT-X-CUE-OUT-CONT',
      type: '<decimal-floating-point-cue-out-cont>',
      playlistType: 'media',
      appliesToNextUri: true,
      isCustom: false
    }, {
      '<decimal-floating-point-cue-out-cont>': NamedPropertyMixin(CastingMixin(CueOutCont, [numberCast, numberCast]), ['value.seconds', 'value.totalDuration'])
    });
  }

  parse(m3u8Data) {
    const hlsObject = super.parse(m3u8Data);
    const videojsObj = toGlobalTags(hlsObject.globals);

    if (hlsObject.playlistType === 'manifest') {
      toMediaGroups(videojsObj, hlsObject.globals);
      toPlaylists(videojsObj, hlsObject.playlists);
    } else {
      toSegments(videojsObj, hlsObject.segments);
    }

    return videojsObj;
  }

  stringify(videojsObj) {
    const createTag = createTagFactory(this);
    const nestedHlsObject = fromGlobalTags(createTag, videojsObj);

    if (videojsObj.playlists?.length) {
      nestedHlsObject.playlists = [];
      fromMediaGroups(createTag, nestedHlsObject, videojsObj);
      fromPlaylists(createTag, nestedHlsObject, videojsObj);
    } else if (videojsObj.segments?.length) {
      nestedHlsObject.segments = [];
      fromSegments(createTag, nestedHlsObject, videojsObj);
    }
    const m3u8Data = super.stringify(nestedHlsObject);

    return m3u8Data;
  }
}

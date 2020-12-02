import m3u8NestedCodec from './m3u8-nested.js';
import { setProperty, getProperty } from './helpers/props.js';

const gatherGlobalTags = (globals) => {
  const output = {
    allowCache: true,
    discontinuityStarts: [],
    segments: []
  };

  globals.forEach((tag) => {
    switch (tag.name) {
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
    }
  });

  return output;
};

const mediaGroupAttr = ['DEFAULT', 'AUTOSELECT', 'FORCED', 'LANGUAGE', 'URI'];
const booleanAttr = ['DEFAULT', 'AUTOSELECT', 'FORCED'];
const camelCaseIt = (str) => str.toLowerCase().replace(/-([a-z])/g, (m) => m[1].toUpperCase());
const buildMediaGroups = (videojsObj, globals) => {
  videojsObj.mediaGroups = videojsObj.mediaGroups || {
    "VIDEO": {},
    "AUDIO": {},
    "CLOSED-CAPTIONS": {},
    "SUBTITLES": {}
  };

  const mediaGroups = videojsObj.mediaGroups;

  globals.forEach((tag) => {
    if (tag.lineType === 'tag' && tag.name === '#EXT-X-MEDIA') {
      const obj = tag.value;

      mediaGroupAttr.forEach((attr) => {
        if (tag.value[attr] === undefined) {
          return;
        }

        let value = tag.value[attr].value;

        if (booleanAttr.indexOf(attr) !== -1) {
          value = value === 'YES';
        }

        setProperty(mediaGroups, [obj.TYPE.value, obj['GROUP-ID'].value, obj.NAME.value, camelCaseIt(attr)], value);
      });
    }
  });
};

const buildPlaylists = (videojsObj, playlists) => {
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
      if (tag.lineType === 'uri') {
        currentObj.uri = tag.value;
      } else if (tag.lineType === 'tag' && tag.name === '#EXT-X-STREAM-INF') {
        const valueProperties = Object.keys(tag.value);

        currentObj.attributes = {};
        valueProperties.forEach((valueProperty) => {
          currentObj.attributes[valueProperty] = tag.value[valueProperty].value;
        });
      }
      // TODO: Support EXT-X-I-FRAME-STREAM-INF
    });

    output.push(currentObj);
  });
};

const switchEndianness = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const output = new Uint8Array(len);

  for (var i = 0; i < len; i += 4) {
    output[i + 3] = bytes[i];
    output[i + 2] = bytes[i + 1];
    output[i + 1] = bytes[i + 2];
    output[i]     = bytes[i + 3];
  }

  return output.buffer;
}

const buildSegments = (videojsObj, segments) => {
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
      timeline: currentDisco,
    };

    if (last && last.key) {
      currentObj.key = last.key;
    }
    if (last && last.map) {
      currentObj.map = last.map;
    }

    segmentArr.forEach((tag) => {
      if (tag.lineType === 'uri') {
        currentObj.uri = tag.value;
      } else if (tag.lineType === 'tag'){
        switch (tag.name) {
        case '#EXTINF':
          currentObj.duration = tag.value.duration;
          if (tag.value.title && tag.value.title.length) {
            currentObj.title = tag.value.title;
          }
          break;
        case '#EXT-X-BYTERANGE':
          currentObj.byterange = tag.value;

          if (isNaN(currentObj.byterange.offset)) {
            const last = output[output.length - 1];

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
          if (tag.value.METHOD) {
            if (tag.value.METHOD.value === 'NONE') {
              delete currentObj.key;
              return;
            }
            currentObj.key.method = tag.value.METHOD.value;
          }
          if (tag.value.URI) {
            currentObj.key.uri = tag.value.URI.value;
          }
          if (tag.value.IV) {
            currentObj.key.iv = new Uint32Array(switchEndianness(tag.value.IV.value));
          }
          break;
        case '#EXT-X-MAP':
          currentObj.map = {
            byterange: tag.value.BYTERANGE.value,
            uri: tag.value.URI.value
          };
          break;
        case '#EXT-X-PROGRAM-DATE-TIME':
          currentObj.dateTimeString = tag.value.toISOString();
          currentObj.dateTimeObject = tag.value;

          if (!videojsObj.dateTimeString) {
            videojsObj.dateTimeString = tag.value.toISOString();
            videojsObj.dateTimeObject = tag.value;
          }
          break;
        case '#EXT-X-DATERANGE':
          // TODO: Figure out what this should look like...
          break;
        }
      }
    });

    output.push(currentObj);
  });
};

export default {
  parse: (m3u8Data) => {
    const hlsObject = m3u8NestedCodec.parse(m3u8Data);

    const videojsObj = gatherGlobalTags(hlsObject.globals);

    if (hlsObject.playlistType === 'manifest') {
      buildMediaGroups(videojsObj, hlsObject.globals);
      buildPlaylists(videojsObj, hlsObject.playlists);
    } else {
      buildSegments(videojsObj, hlsObject.segments);
    }

    return videojsObj;
  },
  stringify: (nestedHlsObject) => {
    const m3u8Data = m3u8NestedCodec.stringify(nestedHlsObject);

    return m3u8Data;
  },
  setCustomTag: m3u8NestedCodec.setCustomTag,
  setCustomType: m3u8NestedCodec.setCustomType,
  getTag: m3u8NestedCodec.getTag
};

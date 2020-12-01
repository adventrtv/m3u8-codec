import m3u8Codec from './m3u8.js';

const detectPlaylistType = (arr) => {
  const {manifest, media} = arr.reduce((results, line) => {
    if (line.lineType==='tag' && line.playlistType !== 'both') {
      results[line.playlistType]++;
    }
    return results;
  },{manifest: 0, media: 0});

  if (manifest > media) {
    if (media !== 0) {
      console.warn('Detected a Manifest Playlist with some Media tags.');
    }
    return 'manifest';
  } else {
    if (manifest !== 0) {
      console.warn('Detected a Manifest Playlist with some Media tags.');
    }
    return 'playlist';
  }
};

const groupPlaylistObject = (hlsObject, type) => {
  const groupLocation = type === 'manifest' ? 'playlists': 'segments';
  const groupedLines = {
    global:[],
    [groupLocation]: []
  };

  hlsObject.reduce((arr, obj) => {
    if (obj.lineType === 'tag' && !obj.appliesToNextUri) {
      arr.push(obj);
    }

    return arr;
  }, groupedLines.global);

  // todo:
  //   spread media-sequence?
  //   spread discontinuity-sequence?

  hlsObject.reduce((arr, obj) => {
    let last = arr[arr.length - 1];

    if (!obj.appliesToNextUri && obj.lineType !== 'uri') {
      return arr;
    }

    if (!last || last.uri) {
      last = {};
      arr.push(last);
    }

    if (obj.lineType === 'tag' && obj.appliesToNextUri) {
      last[obj.name] = obj;
    } else if (obj.lineType === 'uri') {
      last.uri = obj.value;
    }

    return arr;
  }, groupedLines[groupLocation]);

  return groupedLines;
};

export default {
  parse: (m3u8Data) => {
    const hlsObject = m3u8Codec.parse(m3u8Data);
    const playlistType = detectPlaylistType(hlsObject);

    return groupPlaylistObject(hlsObject, playlistType);
  },
  stringify: (hlsObject) => {
    const lines = object.map(lineCodec.stringify);
    const m3u8Data = lines.join('\n');

    return m3u8Data;
  },
  setCustomTag: m3u8Codec.setCustomTag,
  setCustomType: m3u8Codec.setCustomType,
  getTag: m3u8Codec.getTag
};

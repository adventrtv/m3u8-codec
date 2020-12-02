import makeLineCodec from './line-codec.js';
import { tagSpec, typeSpec } from './hls-spec.js';

const lineCodec = makeLineCodec(tagSpec, typeSpec);

const detectPlaylistType = (arr) => {
  const {manifest, media} = arr.reduce((results, line) => {
    if (line.lineType==='tag' && line.playlistType !== 'both') {
      results[line.playlistType]++;
    }
    return results;
  }, { manifest: 0, media: 0 });

  if (manifest > media) {
    if (media !== 0) {
      console.warn('Detected a Manifest Playlist with some Media tags.');
    }
    return 'manifest';
  } else {
    if (manifest !== 0) {
      console.warn('Detected a Media Playlist with some Manifest tags.');
    }
    return 'playlist';
  }
};

const tagsWithDefault = tagSpec.filter((tag) => tag.default !== undefined);

const addDefaults = (hlsObject) => {
  if (hlsObject.playlistType === 'manifest') {
    return hlsObject;
  }

  const missingDefaults = new Map(tagsWithDefault.map((t) => [t.name, t]));

  hlsObject.forEach((line) => {
    missingDefaults.delete(line.name);
  });

  missingDefaults.forEach((missingTag) => {
    const newTag = {
      name: missingTag.name,
      type: missingTag.type,
      value: missingTag.default,
      lineType: 'tag'
    };

    hlsObject.push(newTag);
  });

  return hlsObject;
};

export default {
  parse: (m3u8Data) => {
    const lines = m3u8Data.split('\n');
    const hlsObject = lines.map(lineCodec.parse);

    hlsObject.playlistType = detectPlaylistType(hlsObject);

    return addDefaults(hlsObject);
  },
  stringify: (hlsObject) => {
    const lines = hlsObject.map(lineCodec.stringify);
    const m3u8Data = lines.join('\n');

    return m3u8Data;
  },
  setCustomTag: lineCodec.setCustomTag,
  setCustomType: lineCodec.setCustomType,
  getTag: lineCodec.getTag
};

import LineCodec from './line-codec.js';
import { tagSpec } from './hls-spec.js';

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

export default class M3u8Codec extends LineCodec {
  constructor (mainTagSpec, mainTypeSpec) {
    super(mainTagSpec, mainTypeSpec);
  }

  parse(m3u8Data) {
    const lines = m3u8Data.split('\n');
    const hlsObject = lines.map((l) => super.parse(l));

    hlsObject.playlistType = detectPlaylistType(hlsObject);

    return addDefaults(hlsObject);
  }

  stringify(hlsObject) {
    const lines = hlsObject.map((o) => super.stringify(o));
    const m3u8Data = lines.join('\n');

    return m3u8Data;
  }
};

/* eslint no-console: 0 */

import LineCodec from './line.js';
import { tagSpec } from '../hls.js';

const detectPlaylistType = (arr) => {
  const {manifest, media} = arr.reduce((results, line) => {
    if (line.lineType === 'tag' && line.playlistType !== 'both') {
      results[line.playlistType]++;
    }
    return results;
  }, { manifest: 0, media: 0 });

  if (manifest > media) {
    if (media !== 0) {
      console.warn('Detected a Manifest Playlist with some Media tags.');
    }
    return 'manifest';
  }

  if (manifest !== 0) {
    console.warn('Detected a Media Playlist with some Manifest tags.');
  }
  return 'media';
};

const tagsWithDefault = tagSpec.filter((tag) => tag.default !== undefined);

const addDefaults = (hlsObject) => {
  const missingDefaults = new Map(tagsWithDefault
    .filter(t => t.playlistType === 'both' || t.playlistType === hlsObject.playlistType)
    .map((t) => [t.name, t]));

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

export default class M3U8Codec extends LineCodec {
  constructor(mainTagSpec, mainTypeSpec) {
    super(mainTagSpec, mainTypeSpec);
  }

  parse(m3u8Data) {
    const lines = m3u8Data.split('\n');
    const hlsObject = lines.map((line) => super.parse(line));

    hlsObject.playlistType = detectPlaylistType(hlsObject);

    return addDefaults(hlsObject);
  }

  stringify(hlsObject) {
    const lines = hlsObject?.map((o) => super.stringify(o));
    const m3u8Data = lines.join('\n');

    return m3u8Data;
  }
}

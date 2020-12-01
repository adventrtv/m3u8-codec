import makeLineCodec from './line-codec.js';
import { tagSpec, typeSpec } from './hls-spec.js';

const lineCodec = makeLineCodec(tagSpec, typeSpec);

export default {
  parse: (m3u8Data) => {
    const lines = m3u8Data.split('\n');
    const hlsObject = lines.map(lineCodec.parse);

    return hlsObject;
  },
  stringify: (hlsObject) => {
    const lines = object.map(lineCodec.stringify);
    const m3u8Data = lines.join('\n');

    return m3u8Data;
  },
  setCustomTag: lineCodec.setCustomTag,
  setCustomType: lineCodec.setCustomType,
  getTag: lineCodec.getTag
};

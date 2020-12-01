const { m3u8NestedCodec } = require('../dist/m3u8-codec.cjs.js');
/*
import { tagSpec, typeSpec } from './src/hls-spec.js';

// imports to help me build a new "type"
import makeValueCodecFactory from './src/codecs/value.js';
import { makeRegexCodec } from './src/codecs/regexp.js';

const onlyMediaTags = tagSpec.filter((tag) => tag.playlistType !== 'manifest');
const onlyManifestTags = tagSpec.filter((tag) => tag.playlistType !== 'media');

const mediaPlaylistCodec = makeLineCodec(onlyMediaTags, typeSpec);
const manifestPlaylistCodec = makeLineCodec(onlyManifestTags, typeSpec);

// Let's add fancy new tags
mediaPlaylistCodec.setCustomTag({
  name: '#EXT-X-CUE-IN',
  type: null,
  // type: '<attribute-list>',
  // attributes: [
  //   { name: 'foo', type: 'not_a_real_type' }
  // ]
});

mediaPlaylistCodec.setCustomTag({
  name: '#EXT-X-CUE-OUT',
  type: '<decimal-floating-point>'
});

mediaPlaylistCodec.setCustomType(
  '<decimal-floating-point-cue-out-cont>',
  makeValueCodecFactory(
    makeRegexCodec(/^([0-9]+.?[0-9]*)\/([0-9]+.?[0-9]*)/, (matches) => `${matches[1]}/${matches[2]}`),
    [parseFloat, parseFloat],
    ['seconds', 'totalDuration']
  )
);

mediaPlaylistCodec.setCustomTag({
  name: '#EXT-X-CUE-OUT-CONT',
  type: '<decimal-floating-point-cue-out-cont>'
}
// ,
// {
//   '<decimal-floating-point-cue-out-cont>': makeValueCodecFactory(
//     makeRegexCodec(/^([0-9]+.?[0-9]*)\/([0-9]+.?[0-9]*)/, (matches) => `${matches[1]}/${matches[2]}`),
//     [parseFloat, parseFloat],
//     ['seconds', 'totalDuration']
//   )
// }
);

// manifestPlaylistCodec.setCustomTag({
//   name: '#EXT-X-CUE-OUT-CONT',
//   type: '<decimal-floating-point-cue-out-cont>'
// });

//Adding a custom attribute to an existing tag
mediaPlaylistCodec.getTag('#EXT-X-DATERANGE').setCustomAttribute({
  name: 'X-TEST-ID',
  type:'<hexadecimal-sequence>',
  default: '0xDEADBEEF'
});
*/
const test1 = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio,lo",LANGUAGE="eng",NAME="English",AUTOSELECT=YES,DEFAULT=YES,URI="englo/prog_index.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio,lo",LANGUAGE="fre",NAME="Français",AUTOSELECT=YES,DEFAULT=NO,URI="frelo/prog_index.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio,lo",LANGUAGE="sp",NAME="Espanol",AUTOSELECT=YES,DEFAULT=NO,URI="splo/prog_index.m3u8"

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi",LANGUAGE="eng",NAME="English",AUTOSELECT=YES,DEFAULT=YES,URI="eng/prog_index.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi",LANGUAGE="fre",NAME="Français",AUTOSELECT=YES,DEFAULT=NO,URI="fre/prog_index.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi",LANGUAGE="sp",NAME="Espanol",AUTOSELECT=YES,DEFAULT=NO,URI="sp/prog_index.m3u8"

#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=195023,CODECS="mp4a.40.5",AUDIO="audio,lo",RESOLUTION=1920x1080
lo/prog_index.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=260000,CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio,lo"
lo2/prog_index.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=591680,CODECS="mp4a.40.2, avc1.64001e",AUDIO="audio-hi"
hi/prog_index.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=650000,CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio-hi"
hi2/prog_index.m3u8`;

const test2 = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:587500@522828
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:713084@1110328
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:476580@1823412
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:535612@2299992
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:207176@2835604
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:455900@3042780
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:657248@3498680
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:571708@4155928
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:485040@4727636
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:709136@5212676
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:730004@5921812
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:456276@6651816
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:468684@7108092
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:444996@7576776
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:331444@8021772
hls_450k_video.ts
#EXTINF:1.4167,
#EXT-X-DATERANGE:ID="foo",START-DATE=2012-12-25T14:12:34.123Z
#EXT-X-BYTERANGE:44556@8353216
hls_450k_video.ts
#EXT-X-ENDLIST`;

const obj1 = m3u8NestedCodec.parse(test1);
const obj2 = m3u8NestedCodec.parse(test2);
// console.log(JSON.stringify(lineObjGroup(obj1), null, '  '));
// console.log(JSON.stringify(lineObjGroup(obj2), null, '  '));
// console.log('<<', obj);
console.log(JSON.stringify(obj1, null, '  '));
console.log(JSON.stringify(obj2, null, '  '));
// const out1 = obj1.map(manifestPlaylistCodec.stringify).join('\n');
// const out2 = obj2.map(mediaPlaylistCodec.stringify).join('\n');
// console.log('>>', out1);
// console.log('>>', out2);
// console.log(test1 === out);

const { VideojsCodec, M3u8NestedCodec } = require('../');

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
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
hls_450k_video.ts
#EXTINF:10,
#EXT-X-BYTERANGE:331444@8021772
#This is a video segment!
#This follows the previous comment...
#EXT-X-DISCONTINUITY
hls_450k_video.ts
#EXTINF:1.4167,
#EXT-X-KEY:METHOD=AES-128,URI="https://priv.example.com/key.php?r=54",IV=0x00000000000000000000014BB69D61E4
#EXT-X-MAP:URI="main.mp4",BYTERANGE="720@0"
#EXTINF:6.00600,
#EXT-X-BYTERANGE:5666510@720
main.mp4
#The daterange should be after me!
#EXT-X-DATERANGE:ID="foo",START-DATE=2012-12-25T14:12:34.123Z,FOO="quoted-string here",BAR=0xABC123,BAZ=1.234
#EXT-X-BYTERANGE:44556@8353216
hls_450k_video.ts
#EXT-X-ENDLIST`;

const codec = new VideojsCodec;

const obj1 = codec.parse(test1);
const obj2 = codec.parse(test2);
console.log(JSON.stringify(obj1, null, '  '), '\n');
console.log(JSON.stringify(obj2, null, '  '), '\n');
const out1 = codec.stringify(obj1);
const out2 = codec.stringify(obj2);
console.log('>>', out1, '\n');
console.log('>>', out2, '\n');

console.log(test1, '\n>>', JSON.stringify(obj1, null, '  '), '\n>>', out1);
console.log('\n\n');
console.log(test2, '\n>>', JSON.stringify(obj2, null, '  '), '\n>>', out2);

// console.log(test1 === out1);
// console.log(test2 === out2);

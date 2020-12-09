/* eslint-disable no-console */
const M3U8 = require('../');

const { VideojsCodec, M3U8NestedCodec, M3U8Codec } = M3U8.codecs;
const { CastingMixin, NamedPropertyMixin } = M3U8.mixins;
const { IdentityType } = M3U8.types;
const { numberCast } = M3U8.casts;

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
hi2/prog_index.m3u8\n`;

const test2 = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#This is a global comment, the worst kind of comment
#because it can't be reconstructed in any way that makes sense!
#EXT-X-MEDIA-SEQUENCE:0
\t
#A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:10
hls_450k_video.ts

#Another random comment...
# Line two!
#EXT-X-DATERANGE:ID="foo",START-DATE=2012-12-25T14:12:34.123Z,FOO="quoted-string, here"
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:22:34.123Z
#EXTINF:10,
#EXT-X-BYTERANGE:1000000@522828
#EXT-X-CUE-IN
hls_450k_video.ts`;

const codec = new VideojsCodec();

/*
Unfortunately this example isn't babel-fied so we can't rely on classes

If this example WAS run through bable, then we can just do:

class CueOutCont extends IdentityType {
  regexp = /^([0-9]+.?[0-9]*)\/([0-9]+.?[0-9]*)/;

  stringify(justMatches) {
    return `${justMatches[0]}/${justMatches[1]}`;
  }
}
*/

function CueOutCont() {
  this.regexp = /^([0-9]+.?[0-9]*)\/([0-9]+.?[0-9]*)/;
}
CueOutCont.prototype = new IdentityType();
CueOutCont.prototype.stringify = function(justMatches) {
  return `${justMatches[0]}/${justMatches[1]}`;
};

codec.setCustomTag({
  name: '#EXT-X-CUE-IN',
  playlistType: 'media',
  appliesToNextUri: true
});

codec.setCustomTag({
  name: '#EXT-X-CUE-OUT',
  type: '<decimal-floating-point>',
  playlistType: 'media',
  appliesToNextUri: true
});

codec.setCustomTag({
  name: '#EXT-X-CUE-OUT-CONT',
  type: '<decimal-floating-point-cue-out-cont>',
  playlistType: 'media',
  appliesToNextUri: true
}, {
  '<decimal-floating-point-cue-out-cont>': NamedPropertyMixin(CastingMixin(CueOutCont, [numberCast, numberCast]), ['value.seconds', 'value.totalDuration'])
});

const obj1 = codec.parse(test1);
const obj2 = codec.parse(test2);

const out1 = codec.stringify(obj1);
const out2 = codec.stringify(obj2);

console.log('>> Original M3U8 >>');
console.log(test1);
console.log('>> Parsed Data >>');
console.log(JSON.stringify(obj1, null, '  '));
console.log('>> Stringified Data >>');
console.log(out1);
console.log('\n');
console.log('>> Original M3U8 >>');
console.log(test2);
console.log('>> Parsed Data >>');
console.log(JSON.stringify(obj2, null, '  '));
console.log('>> Stringified Data >>');
console.log(out2);

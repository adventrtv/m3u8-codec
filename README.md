# @adventr/m3u8-codec

A parser/serializer library for M3U8 (HLS) manifests ...and maybe more?

```js
import M3u8Codec from 'm3u8-codec';

const object = M3u8Codec.parse(m3u8Data);
const newM3u8Data = M3u8Codec.stringify(object);
```

## CODECS
The library currently defines 4 codecs in order of increasing complexity:

### LineCodec
`LineCodec` is the super class for ALL other codecs and has the bulk of the parsing/stringifying functionality. YOU SHOULD NOT USE THIS CODEC DIRECTLY as it only operates on a line-level and it's more convenient to use `M3U8Codec`, described below, if you need extremely low-level access.

#### LineCodec#parse
Parses a single line at a time and returns a single object for the entire line that is either a `tag`, `comment`, `uri`, or `empty`.

Example:
```js
const codec = new LineCodec();

codec.parse('#EXT-X-DATERANGE:ID="foo",START-DATE=2012-12-25T14:12:34.123Z,FOO="quoted-string, here"');

// Results in:
{
  name: '#EXT-X-DATERANGE',
  type: '<attribute-list>',
  playlistType: 'media',
  appliesToNextUri: true,
  value: [
    {
      name: 'ID',
      type: '<quoted-string>',
      value: 'foo'
    },
    {
      name: 'START-DATE',
      type: '<date-time-msec>',
      value: new Date('2012-12-25T14:12:34.123Z')
    },
    {
      name: 'FOO',
      type: '<quoted-string>',
      value: 'quoted-string, here'
    }
  ]
  lineType: 'tag'
}
```

#### LineCodec#stringify
Serializes a single object that is either a `tag`, `comment`, `uri`, or `empty` and returns the string representation.

```js
const string = codec.stringify(parsed);

// string =>
`#EXT-X-DATERANGE:ID="foo",START-DATE=2012-12-25T14:12:34.123Z,FOO="quoted-string, here"`
```

### M3U8Codec _extends LineCodec_
`M3U8Codec` is extremely low-level and it provides an array of line objects that are in-order and can be re-serialized without any data loss. The output should only differ from the input in whitespace (the result of some trimming done for convenience).

#### M3U8Codec#parse
Parses an entire file and returns an array of line-objects.

```js
const codec = new M3U8Codec();

codec.parse(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0

# A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:20
hls_450k_video.ts`);

// Results in:
[
  {
    name: '#EXTM3U',
    type: null,
    playlistType: 'both',
    value: null,
    lineType: 'tag'
  },
  {
    name: '#EXT-X-TARGETDURATION',
    type: '<decimal-integer>',
    playlistType: 'media',
    value: 10,
    lineType: 'tag'
  },
  {
    name: '#EXT-X-VERSION',
    type: '<decimal-integer>',
    playlistType: 'both',
    value: 4,
    lineType: 'tag'
  },
  {
    name: '#EXT-X-ALLOW-CACHE',
    type: '<enumerated-string>',
    playlistType: 'media',
    maxVersion: 6,
    value: 'YES',
    lineType: 'tag'
  },
  {
    name: '#EXT-X-MEDIA-SEQUENCE',
    type: '<decimal-integer>',
    playlistType: 'media',
    value: 0,
    lineType: 'tag'
  },
  {
    lineType: 'empty'
  },
  {
    lineType: 'comment',
    value: '# A comment here'
  },
  {
    name: '#EXT-X-PROGRAM-DATE-TIME',
    type: '<date-time-msec>',
    playlistType: 'media',
    appliesToNextUri: true,
    value: new Date('2012-12-25T14:12:34.123Z'),
    lineType: 'tag'
  },
  {
    name: '#EXTINF',
    type: '<decimal-floating-point-duration>',
    playlistType: 'media',
    appliesToNextUri: true,
    value: {
      'duration': 10,
      'title': 'testing this, thing!""'
    },
    lineType: 'tag'
  },
  {
    name: '#EXT-X-BYTERANGE',
    type: '<decimal-byterange>',
    playlistType: 'media',
    appliesToNextUri: true,
    minVersion: 4,
    value: {
      length: 522828,
      offset: 0
    },
    lineType: 'tag'
  },
  {
    name: '#EXT-X-CUE-OUT',
    type: '<decimal-floating-point>',
    playlistType: 'media',
    appliesToNextUri: true,
    isCustom: true,
    value: 20,
    lineType: 'tag'
  },
  {
    lineType: 'uri',
    value: 'hls_450k_video.ts'
  }
]
```
#### M3U8Codec#stringify
Takes an array and generates a single string representing the resulting M3U8 manifest.

```js
const string = codec.stringify(parsed);

// string =>
`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0

# A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:20
hls_450k_video.ts
#EXT-X-DISCONTINUITY-SEQUENCE:0`
```

### M3U8NestedCodec _extends M3U8Codec_
`M3U8NestedCodec` further processes the line-objects and produces a more meaningful representation. Tags are grouped into sets based on their purpose. All global tags are collected and stored, in order. All `uri` lines and any tags that relate to those `uri`s are also collected into individual arrays - again preserving order. Comments are intelligently collected along with the tags they precede and end up in either the global or per-playlist/per-segment collections.

There is some contextual information lost in this transform. The resulting serialized object is functionally similar but, for instance, global tags are all at the top of the file.

#### M3U8NestedCodec#parse
Parses an entire file and returns an object with a `globals` property - an array of global `tags` `uri` and `comments`. And either a `playlists` property - an array containing arrays of `tags` that represent a single playlist. Or a `segments` property - an array containing arrays of `tags` all related to a single segment.

```js
const codec = new M3U8NestedCodec();

codec.parse(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0

# A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:20
hls_450k_video.ts`);

// Results in:
{
  playlistType: 'media',
  globals: [
    {
      name: '#EXTM3U',
      type: null,
      playlistType: 'both',
      value: null,
      lineType: 'tag'
    },
    {
      name: '#EXT-X-TARGETDURATION',
      type: '<decimal-integer>',
      playlistType: 'media',
      value: 10,
      lineType: 'tag'
    },
    {
      name: '#EXT-X-VERSION',
      type: '<decimal-integer>',
      playlistType: 'both',
      value: 4,
      lineType: 'tag'
    },
    {
      name: '#EXT-X-ALLOW-CACHE',
      type: '<enumerated-string>',
      playlistType: 'media',
      maxVersion: 6,
      value: 'YES',
      lineType: 'tag'
    },
    {
      name: '#EXT-X-MEDIA-SEQUENCE',
      type: '<decimal-integer>',
      playlistType: 'media',
      value: 0,
      lineType: 'tag'
    },
    {
      name: '#EXT-X-DISCONTINUITY-SEQUENCE',
      type: '<decimal-integer>',
      value: 0,
      lineType: 'tag'
    }
  ],
  segments: [
    [
      {
        lineType: 'comment',
        value: '# A comment here'
      },
      {
        name: '#EXT-X-PROGRAM-DATE-TIME',
        type: '<date-time-msec>',
        playlistType: 'media',
        appliesToNextUri: true,
        value: new Date('2012-12-25T14:12:34.123Z'),
        lineType: 'tag'
      },
      {
        name: '#EXTINF',
        type: '<decimal-floating-point-duration>',
        playlistType: 'media',
        appliesToNextUri: true,
        value: {
          duration: 10,
          title: 'testing this, thing!""'
        },
        lineType: 'tag'
      },
      {
        name: '#EXT-X-BYTERANGE',
        type: '<decimal-byterange>',
        playlistType: 'media',
        appliesToNextUri: true,
        minVersion: 4,
        value: {
          length: 522828,
          offset: 0
        },
        lineType: 'tag'
      },
      {
        name: '#EXT-X-CUE-OUT',
        type: '<decimal-floating-point>',
        playlistType: 'media',
        appliesToNextUri: true,
        isCustom: true,
        value: 20,
        lineType: 'tag'
      },
      {
        lineType: 'uri',
        value: 'hls_450k_video.ts'
      }
    ]
  ]
}
```

#### M3U8NestedCodec#stringify

```js
const string = codec.stringify(parsed);

// string =>
`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-DISCONTINUITY-SEQUENCE:0
# A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:20
hls_450k_video.ts`
```

### VideojsCodec _extends M3U8NestedCodec_
`VideojsCodec` is a m3u8-parser compatible output format. The format is extremely terse but results in a huge loss of context. The reconstructed output is functionally identical to the input but will have lost all comments and sequence. Certain optimizations (like byte-range shorthand) will be missing if they were present in the input.

#### VideojsCodec#parse
```js
const codec = new VideojsCodec();

const parsed = codec.parse(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:4
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0

# A comment here
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXTINF:10,testing this, thing!""
#EXT-X-BYTERANGE:522828@0
#EXT-X-CUE-OUT:20
hls_450k_video.ts`);

// parsed =>
{
    allowCache: true,
    discontinuityStarts: [],
    segments: [
    {
        timeline: 0,
        duration: 10,
        dateTimeString: '2012-12-25T14:12:34.123Z',
        dateTimeObject: new Date('2012-12-25T14:12:34.123Z'),
        byterange:
        {
            length: 522828,
            offset: 0
        },
        cueOut: 20,
        uri: 'hls_450k_video.ts'
    }],
    targetDuration: 10,
    version: 4,
    mediaSequence: 0,
    discontinuitySequence: 0,
    dateTimeString: '2012-12-25T14:12:34.123Z',
    dateTimeObject: new Date('2012-12-25T14:12:34.123Z')
}
```

#### VideojsCodec#stringify

```js
const string = codec.stringify(parsed);

// string =>
`#EXTM3U
#EXT-X-VERSION:4
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-DISCONTINUITY-SEQUENCE:0
#EXT-X-ALLOW-CACHE:YES
#EXTINF:10,
#EXT-X-BYTERANGE:522828@0
#EXT-X-PROGRAM-DATE-TIME:2012-12-25T14:12:34.123Z
#EXT-X-CUE-OUT:20
hls_450k_video.ts`
```
## TODO
1. Validation: The bones are all there for a more strict validator. Each tag definition has `minVersion` `maxVersion`, `allowed` and/or `required` as applicable. Just need to run a validation pass once the parsing is complete.
2.


## License

Apache-2.0. Copyright (c) Ossum Technology Inc. (dba Adventr)

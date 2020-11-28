// tag locations:
// manifest - can only appear in the manifest
// playlist - can only appear in the playlist
// segment - can only appear in the playlist, applies to segments
// both - can appear anywhere, DOES NOT apply to segments

const tags = {
  // BASIC TAGS
  '#EXTM3U': {
    type: null,
    required: true,
    location: 'both'
  },

  '#EXT-X-VERSION': {
    type: '<decimal-integer>',
    location: 'both'
  },

  // PLAYLIST-ONLY, SEGMENT TAGS
  '#EXTINF': {
    type: '<decimal-floating-point-duration>', // (ctx) => ctx['#EXT-X-VERSION'].value < 3 ? '<decimal-integer-duration>' : '<decimal-floating-point-duration>'
    location: 'playlist',
    segment: true
  },

  '#EXT-X-BYTERANGE': {
    type: '<decimal-byterange>',
    minVersion: 4,
    location: 'playlist',
    segment: true
  },

  '#EXT-X-DISCONTINUITY': {
    type: null,
    location: 'playlist',
    segment: true
  },

  '#EXT-X-KEY':{
    type: '<attribute-list>',
    attributes: {
      'METHOD': {
        type: '<enumerated-string>',
        required: true,
        enum: [
          'NONE',
          'AES-128',
          'SAMPLE-AES'
        ]
      },
      'URI': {
        type: '<uri>',
        required: (ctx) => ctx.METHOD !== 'NONE'
      },
      'IV': {
        type: '<hexadecimal-sequence>',
        minVersion: 2
      },
      'KEYFORMAT': {
        type: '<quoted-string>',
        minVersion: 5
      },
      'KEYFORMATVERSIONS': {
        type: '<quoted-string>',
        minVersion: 5
      }
    },
    location: 'playlist',
    segment: true
  },

  '#EXT-X-MAP':{
    type: '<attribute-list>',
    attributes: {
      'URI': {
        type: '<quoted-string>',
        required: true
      },
      'BYTERANGE': {
        type: '<decimal-byterange>'
      }
    },
    location: 'playlist',
    segment: true
  },

  '#EXT-X-PROGRAM-DATE-TIME': {
    type: '<date-time-msec>',
    location: 'playlist'
  },

  '#EXT-X-DATERANGE': {
    type: '<attribute-list>',
    attributes: {
      'ID': {
        type: '<quoted-string>',
        required: true
      },
      'CLASS': {
        type: '<quoted-string>'
      },
      'START-DATE': {
        type: '<date-time-msec>',
        required: true
      },
      'END-DATE': {
        type: '<date-time-msec>'
      },
      'DURATION': {
        type: '<decimal-floating-point>'
      },
      'PLANNED-DURATION': {
        type: '<decimal-floating-point>'
      },
      'SCTE35-CMD': {
        type: '<hexadecimal-sequence>'
      },
      'SCTE35-OUT': {
        type: '<hexadecimal-sequence>'
      },
      'SCTE35-IN': {
        type: '<hexadecimal-sequence>'
      },
      'END-ON-NEXT': {
        type: '<enumerated-string>',
        enum: [
          'YES'
        ]
      },
      '*': {
        type: '<quoted-string>'
      }
    },
    location: 'playlist',
    segment: true
  },

  // PLAYLIST-ONLY TAGS
  '#EXT-X-TARGETDURATION': {
    type: '<decimal-integer>',
    required: true,
    location: 'playlist'
  },

  '#EXT-X-MEDIA-SEQUENCE': {
    type: '<decimal-integer>',
    default: 0,
    location: 'playlist'
  },

  '#EXT-X-DISCONTINUITY-SEQUENCE': {
    type: '<decimal-integer>',
    default: 0,
    location: 'playlist'
  },

  '#EXT-X-ENDLIST': {
    type: null,
    location: 'playlist'
  },

  '#EXT-X-PLAYLIST-TYPE':{
    type: '<enumerated-string>',
    enum: [
      'EVENT',
      'VOD'
    ],
    location: 'playlist'
  },

  '#EXT-X-I-FRAMES-ONLY': {
    type: null,
    location: 'playlist'
  },

  '#EXT-X-ALLOW-CACHE': {
    type: '<enumerated-string>',
    enum: [
      'YES',
      'NO'
    ],
    maxVersion: 6,
    location: 'playlist'
  },

  // MANIFEST-ONLY TAGS
  '#EXT-X-MEDIA':{
    type: '<attribute-list>',
    attributes: {
      'TYPE': {
        type: '<enumerated-string>',
        required: true,
        enum: [
          'AUDIO',
          'VIDEO',
          'SUBTITLES',
          'CLOSED-CAPTIONS'
        ]
      },
      'URI': {
        type: '<quoted-string>'
      },
      'GROUP-ID': {
        type: '<quoted-string>',
      },
      'LANGUAGE': {
        type: '<quoted-string>'
      },
      'ASSOC-LANGUAGE': {
        type: '<quoted-string>'
      },
      'NAME': {
        type: '<quoted-string>'
      },
      'DEFAULT': {
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO'
      },
      'AUTOSELECT': {
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO'
      },
      'FORCED': {
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO'
      },
      'INSTREAM-ID': {
        type: '<enumerated-string>',
        required: (ctx) => ctx.TYPE === 'CLOSED-CAPTIONS',
        allowed: (ctx) => ctx.TYPE === 'CLOSED-CAPTIONS',
        enum: [
          'CC1', 'CC2', 'CC3', 'CC4',
           'SERVICE1',  'SERVICE2',  'SERVICE3',  'SERVICE4',  'SERVICE5',  'SERVICE6',  'SERVICE7',  'SERVICE8',
           'SERVICE9', 'SERVICE10', 'SERVICE11', 'SERVICE12', 'SERVICE13', 'SERVICE14', 'SERVICE15', 'SERVICE16',
          'SERVICE17', 'SERVICE18', 'SERVICE19', 'SERVICE20', 'SERVICE21', 'SERVICE22', 'SERVICE23', 'SERVICE24',
          'SERVICE25', 'SERVICE26', 'SERVICE27', 'SERVICE28', 'SERVICE29', 'SERVICE30', 'SERVICE31', 'SERVICE32',
          'SERVICE33', 'SERVICE34', 'SERVICE35', 'SERVICE36', 'SERVICE37', 'SERVICE38', 'SERVICE39', 'SERVICE40',
          'SERVICE41', 'SERVICE42', 'SERVICE43', 'SERVICE44', 'SERVICE45', 'SERVICE46', 'SERVICE47', 'SERVICE48',
          'SERVICE49', 'SERVICE50', 'SERVICE51', 'SERVICE52', 'SERVICE53', 'SERVICE54', 'SERVICE55', 'SERVICE56',
          'SERVICE57', 'SERVICE58', 'SERVICE59', 'SERVICE60', 'SERVICE61', 'SERVICE62', 'SERVICE63'
        ]
      },
      'CHARACTERISTICS': {
        type: '<quoted-string>'
      },
      'CHANNELS': {
        type: '<quoted-string>'
      },
    },
    location: 'manifest'
  },

  '#EXT-X-STREAM-INF': {
    // followed by <URI>
    type: '<attribute-list>',
    attributes: {
      'BANDWIDTH': {
        type: '<decimal-integer>',
        required: true
      },
      'AVERAGE-BANDWIDTH': {
        type: '<decimal-integer>'
      },
      'CODECS': {
        type: '<quoted-string>'
      },
      'RESOLUTION': {
        type: '<decimal-resolution>'
      },
      'FRAME-RATE': {
        type: '<decimal-floating-point>'
      },
      'HDCP-LEVEL': {
        type: '<enumerated-string>',
        enum: [
          'TYPE-0',
          'NONE'
        ]
      },
      'AUDIO': {
        type: '<quoted-string>'
      },
      'VIDEO': {
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        type: '<quoted-string>'
      },
      'SUBTITLES': {
        type: '<quoted-string>'
      },
      'CLOSED-CAPTIONS': {
        // CAN also be NONE
        type: '<quoted-string>'
      },
      'PROGRAM-ID': {
        type: '<decimal-integer>',
        maxVersion: 5
      }
    },
    location: 'manifest',
    segment: true
  },

  '#EXT-X-I-FRAME-STREAM-INF': {
    type: '<attribute-list>',
    attributes: {
      'BANDWIDTH': {
        type: '<decimal-integer>',
        required: true
      },
      'AVERAGE-BANDWIDTH': {
        type: '<decimal-integer>'
      },
      'CODECS': {
        type: '<quoted-string>'
      },
      'RESOLUTION': {
        type: '<decimal-resolution>'
      },
      'HDCP-LEVEL': {
        type: '<enumerated-string>',
        enum: [
          'TYPE-0',
          'NONE'
        ]
      },
      'VIDEO': {
        type: '<quoted-string>'
      },
      'URI': {
        type: '<quoted-string>'
      },
      'PROGRAM-ID': {
        type: '<decimal-integer>',
        maxVersion: 5
      }
    },
    location: 'manifest'
  },

  '#EXT-X-SESSION-DATA': {
    type: '<attribute-list>',
    attributes: {
      'DATA-ID': {
        type: '<quoted-string>',
        required: true
      },
      'VALUE': {
        type: '<quoted-string>'
      },
      'URI': {
        type: '<quoted-string>'
      },
      'LANGUAGE': {
        type: '<quoted-string>'
      }
    },
    location: 'manifest'
  },

  '#EXT-X-SESSION-KEY': {
    type: '<attribute-list>',
    attributes: {
      'METHOD': {
        type: '<enumerated-string>',
        required: true,
        enum: [
          'AES-128',
          'SAMPLE-AES'
        ]
      },
      'URI': {
        type: '<uri>',
        required: (ctx) => ctx.METHOD !== 'NONE'
      },
      'IV': {
        type: '<hexadecimal-sequence>',
        minVersion: 2
      },
      'KEYFORMAT': {
        type: '<quoted-string>',
        minVersion: 5
      },
      'KEYFORMATVERSIONS': {
        type: '<quoted-string>',
        minVersion: 5
      }
    },
    location: 'manifest'
  },

  // BOTH
  '#EXT-X-INDEPENDENT-SEGMENTS': {
    type: null,
    location: 'both'
  },

  '#EXT-X-START': {
    type: '<attribute-list>',
    attributes: {
      'TIME-OFFSET': {
        type: '<signed-decimal-floating-point>'
      },
      'PRECISE': {
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO'
      }
    },
    location: 'both'
  }
};

const addTagName = () => {
  const keys = Object.keys(tags);
  keys.forEach(key => {
    tags[key].name = key;
    const attrs = tags[key].attributes;
    if (attrs) {
      const attrsKeys = Object.keys(attrs);
      attrsKeys.forEach(attrKey => {
        attrs[attrKey].name = attrKey;
      });
    }
  });
  return tags;
}

module.exports = addTagName();

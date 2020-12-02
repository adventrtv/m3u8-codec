// "playlistType":
// manifest - can only appear in the main manifest
// media - can only appear in the media playlist
// both - can appear anywhere

// "appliesToNextUri":
// If true, the tag defines properties that apply to the next "<uri>"

const tagSpec = [
  // BASIC TAGS
  {
    name: '#EXTM3U',
    type: null,
    required: true,
    playlistType: 'both',
    description: 'The EXTM3U tag indicates that the file is an Extended M3U [M3U] Playlist file.  It MUST be the first line of every Media Playlist and every Master Playlist.'
  },

  {
    name: '#EXT-X-VERSION',
    type: '<decimal-integer>',
    playlistType: 'both',
    description: 'The EXT-X-VERSION tag indicates the compatibility version of the Playlist file, its associated media, and its server.  The EXT-X-VERSION tag applies to the entire Playlist file.'
  },

  // PLAYLIST-ONLY, SEGMENT TAGS
  {
    name: '#EXTINF',
    type: '<decimal-floating-point-duration>',
    // (ctx) => ctx['#EXT-X-VERSION'].value < 3 ? '<decimal-integer-duration>' : '<decimal-floating-point-duration>'
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXTINF tag specifies the duration of a Media Segment.  It applies only to the next Media Segment.  This tag is REQUIRED for each Media Segment.'
  },

  {
    name: '#EXT-X-BYTERANGE',
    type: '<decimal-byterange>',
    minVersion: 4,
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXT-X-BYTERANGE tag indicates that a Media Segment is a sub-range of the resource identified by its URI.  It applies only to the next URI line that follows it in the Playlist.'
  },

  {
    name: '#EXT-X-DISCONTINUITY',
    type: null,
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXT-X-DISCONTINUITY tag indicates a discontinuity between the Media Segment that follows it and the one that preceded it.'
  },

  {
    name: '#EXT-X-KEY',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'METHOD',
        type: '<enumerated-string>',
        required: true,
        enum: [
          'NONE',
          'AES-128',
          'SAMPLE-AES'
        ],
        description: 'The value is an enumerated-string that specifies the encryption method.'
      },
      {
        name: 'URI',
        type: '<uri>',
        required: (ctx) => ctx.METHOD !== 'NONE',
        description: 'The value is a quoted-string containing a URI that specifies how to obtain the key.'
      },
      {
        name: 'IV',
        type: '<hexadecimal-sequence>',
        minVersion: 2,
        description: 'The value is a hexadecimal-sequence that specifies a 128-bit unsigned integer Initialization Vector to be used with the key.'
      },
      {
        name: 'KEYFORMAT',
        type: '<quoted-string>',
        minVersion: 5,
        description: 'The value is a quoted-string that specifies how the key is represented in the resource identified by the URI; see Section 5 for more detail.'
      },
      {
        name: 'KEYFORMATVERSIONS',
        type: '<quoted-string>',
        minVersion: 5,
        description: 'The value is a quoted-string containing one or more positive integers separated by the "/" character (for example, "1", "1/2", or "1/2/5").  If more than one version of a particular KEYFORMAT is defined, this attribute can be used to indicate which version(s) this instance complies with.'
      }
    ],
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'Media Segments MAY be encrypted.  The EXT-X-KEY tag specifies how to decrypt them.  It applies to every Media Segment and to every Media Initialization Section declared by an EXT-X-MAP tag that appears between it and the next EXT-X-KEY tag in the Playlist file with the same KEYFORMAT attribute (or the end of the Playlist file).  Two or more EXT-X-KEY tags with different KEYFORMAT attributes MAY apply to the same Media Segment if they ultimately produce the same decryption key.'
  },

  {
    name: '#EXT-X-MAP',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'URI',
        type: '<quoted-string>',
        required: true,
        description: 'The value is a quoted-string containing a URI that identifies a resource that contains the Media Initialization Section.'
      },
      {
        name: 'BYTERANGE',
        type: '<quoted-decimal-byterange>',
        description: 'The value is a quoted-string specifying a byte range into the resource identified by the URI attribute. This attribute is OPTIONAL; if it is not present, the byte range is the entire resource indicated by the URI.'
      }
    ],
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXT-X-MAP tag specifies how to obtain the Media Initialization Section (Section 3) required to parse the applicable Media Segments. It applies to every Media Segment that appears after it in the Playlist until the next EXT-X-MAP tag or until the end of the Playlist.'
  },

  {
    name: '#EXT-X-PROGRAM-DATE-TIME',
    type: '<date-time-msec>',
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXT-X-PROGRAM-DATE-TIME tag associates the first sample of a Media Segment with an absolute date and/or time.  It applies only to the next Media Segment.'
  },

  {
    name: '#EXT-X-DATERANGE',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'ID',
        type: '<quoted-string>',
        required: true,
        description: 'A quoted-string that uniquely identifies a Date Range in the Playlist.'
      },
      {
        name: 'CLASS',
        type: '<quoted-string>',
        description: 'A client-defined quoted-string that specifies some set of attributes and their associated value semantics.  All Date Ranges with the same CLASS attribute value MUST adhere to these semantics.'
      },
      {
        name: 'START-DATE',
        type: '<date-time-msec>',
        required: true,
        description: 'A quoted-string containing the ISO-8601 date at which the Date Range begins.'
      },
      {
        name: 'END-DATE',
        type: '<date-time-msec>',
        description: 'A quoted-string containing the ISO-8601 date at which the Date Range ends.  It MUST be equal to or later than the value of the START-DATE attribute.'
      },
      {
        name: 'DURATION',
        type: '<decimal-floating-point>',
        description: 'The duration of the Date Range expressed as a decimal-floating-point number of seconds.  It MUST NOT be negative.  A single instant in time (e.g., crossing a finish line) SHOULD be represented with a duration of 0.'
      },
      {
        name: 'PLANNED-DURATION',
        type: '<decimal-floating-point>',
        description: 'The expected duration of the Date Range expressed as a decimal-floating-point number of seconds.  It MUST NOT be negative.  This attribute SHOULD be used to indicate the expected duration of a Date Range whose actual duration is not yet known.'
      },
      {
        name: 'SCTE35-CMD',
        type: '<hexadecimal-sequence>',
        description: ''
      },
      {
        name: 'SCTE35-OUT',
        type: '<hexadecimal-sequence>',
        description: ''
      },
      {
        name: 'SCTE35-IN',
        type: '<hexadecimal-sequence>',
        description: ''
      },
      {
        name: 'END-ON-NEXT',
        type: '<enumerated-string>',
        enum: [
          'YES'
        ],
        description: 'An enumerated-string whose value MUST be YES.  This attribute indicates that the end of the range containing it is equal to the START-DATE of its Following Range.'
      },
      {
        name: '*',
        type: '<quoted-string>'
      }
    ],
    playlistType: 'media',
    appliesToNextUri: true,
    description: 'The EXT-X-DATERANGE tag associates a Date Range (i.e., a range of time defined by a starting and ending date) with a set of attribute/ value pairs.'
  },

  // PLAYLIST-ONLY TAGS
  {
    name: '#EXT-X-TARGETDURATION',
    type: '<decimal-integer>',
    required: true,
    playlistType: 'media',
    description: 'The EXT-X-TARGETDURATION tag specifies the maximum Media Segment duration.  The EXTINF duration of each Media Segment in the Playlist file, when rounded to the nearest integer, MUST be less than or equal to the target duration; longer segments can trigger playback stalls or other errors.  It applies to the entire Playlist file.'
  },

  {
    name: '#EXT-X-MEDIA-SEQUENCE',
    type: '<decimal-integer>',
    default: 0,
    playlistType: 'media',
    description: 'The EXT-X-MEDIA-SEQUENCE tag indicates the Media Sequence Number of the first Media Segment that appears in a Playlist file.'
  },

  {
    name: '#EXT-X-DISCONTINUITY-SEQUENCE',
    type: '<decimal-integer>',
    default: 0,
    playlistType: 'media',
    description: 'The EXT-X-DISCONTINUITY-SEQUENCE tag allows synchronization between different Renditions of the same Variant Stream or different Variant Streams that have EXT-X-DISCONTINUITY tags in their Media Playlists.'
  },

  {
    name: '#EXT-X-ENDLIST',
    type: null,
    playlistType: 'media',
    description: 'The EXT-X-ENDLIST tag indicates that no more Media Segments will be added to the Media Playlist file.  It MAY occur anywhere in the Media Playlist file.'
  },

  {
    name: '#EXT-X-PLAYLIST-TYPE',
    type: '<enumerated-string>',
    enum: [
      'EVENT',
      'VOD'
    ],
    playlistType: 'media',
    description: 'The EXT-X-PLAYLIST-TYPE tag provides mutability information about the Media Playlist file.  It applies to the entire Media Playlist file. It is OPTIONAL.'
  },

  {
    name: '#EXT-X-I-FRAMES-ONLY',
    type: null,
    playlistType: 'media',
    description: 'The EXT-X-I-FRAMES-ONLY tag indicates that each Media Segment in the Playlist describes a single I-frame.  I-frames are encoded video frames whose encoding does not depend on any other frame.  I-frame Playlists can be used for trick play, such as fast forward, rapid reverse, and scrubbing.'
  },

  {
    name: '#EXT-X-ALLOW-CACHE',
    type: '<enumerated-string>',
    enum: [
      'YES',
      'NO'
    ],
    default: 'YES',
    maxVersion: 6,
    playlistType: 'media',
    description: 'The EXT-X-ALLOW-CACHE tag indicates whether the client MAY or MUST NOT cache downloaded media segments for later replay.  It MAY occur anywhere in the Playlist file; it MUST NOT occur more than once.  The EXT-X-ALLOW-CACHE tag applies to all segments in the playlist.'
  },

  // MANIFEST-ONLY TAGS
  {
    name: '#EXT-X-MEDIA',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'TYPE',
        type: '<enumerated-string>',
        required: true,
        enum: [
          'AUDIO',
          'VIDEO',
          'SUBTITLES',
          'CLOSED-CAPTIONS'
        ],
        description: 'The value is an enumerated-string; valid strings are AUDIO, VIDEO, SUBTITLES, and CLOSED-CAPTIONS.  Typically, closed-caption [CEA608] media is carried in the video stream.  Therefore, an EXT-X-MEDIA tag with TYPE of CLOSED- CAPTIONS does not specify a Rendition; the closed-caption media is present in the Media Segments of every video Rendition.'
      },
      {
        name: 'URI',
        type: '<quoted-string>',
        allowed: (ctx) => ctx.TYPE !== 'CLOSED-CAPTIONS',
        description: 'The value is a quoted-string containing a URI that identifies the Media Playlist file. If the TYPE is CLOSED-CAPTIONS, the URI attribute MUST NOT be present.'
      },
      {
        name: 'GROUP-ID',
        type: '<quoted-string>',
        required: true,
        description: 'The value is a quoted-string that specifies the group to which the Rendition belongs.'
      },
      {
        name: 'LANGUAGE',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing one of the standard Tags for Identifying Languages [RFC5646], which identifies the primary language used in the Rendition.'
      },
      {
        name: 'ASSOC-LANGUAGE',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a language tag [RFC5646] that identifies a language that is associated with the Rendition. An associated language is often used in a different role than the language specified by the LANGUAGE attribute (e.g., written versus spoken or a fallback dialect).'
      },
      {
        name: 'NAME',
        type: '<quoted-string>',
        required: true,
        description: 'The value is a quoted-string containing a human-readable description of the Rendition.  If the LANGUAGE attribute is present, then this description SHOULD be in that language.'
      },
      {
        name: 'DEFAULT',
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO',
        description: 'The value is an enumerated-string; valid strings are YES and NO. If the value is YES, then the client SHOULD play this Rendition of the content in the absence of information from the user indicating a different choice.'
      },
      {
        name: 'AUTOSELECT',
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO',
        description: 'The value is an enumerated-string; valid strings are YES and NO. This attribute is OPTIONAL.  Its absence indicates an implicit value of NO.  If the value is YES, then the client MAY choose to play this Rendition in the absence of explicit user preference because it matches the current playback environment, such as chosen system language.'
      },
      {
        name: 'FORCED',
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        description: 'A value of YES indicates that the Rendition contains content that is considered essential to play.  When selecting a FORCED Rendition, a client SHOULD choose the one that best matches the current playback environment (e.g., language).  A value of NO indicates that the Rendition contains content that is intended to be played in response to explicit user request.'
      },
      {
        name: 'INSTREAM-ID',
        type: '<enumerated-string>',
        required: (ctx) => ctx.TYPE === 'CLOSED-CAPTIONS',
        allowed: (ctx) => ctx.TYPE === 'CLOSED-CAPTIONS',
        enum: [
          'CC1', 'CC2', 'CC3', 'CC4',
          'SERVICE1', 'SERVICE2', 'SERVICE3', 'SERVICE4', 'SERVICE5', 'SERVICE6', 'SERVICE7', 'SERVICE8',
          'SERVICE9', 'SERVICE10', 'SERVICE11', 'SERVICE12', 'SERVICE13', 'SERVICE14', 'SERVICE15', 'SERVICE16',
          'SERVICE17', 'SERVICE18', 'SERVICE19', 'SERVICE20', 'SERVICE21', 'SERVICE22', 'SERVICE23', 'SERVICE24',
          'SERVICE25', 'SERVICE26', 'SERVICE27', 'SERVICE28', 'SERVICE29', 'SERVICE30', 'SERVICE31', 'SERVICE32',
          'SERVICE33', 'SERVICE34', 'SERVICE35', 'SERVICE36', 'SERVICE37', 'SERVICE38', 'SERVICE39', 'SERVICE40',
          'SERVICE41', 'SERVICE42', 'SERVICE43', 'SERVICE44', 'SERVICE45', 'SERVICE46', 'SERVICE47', 'SERVICE48',
          'SERVICE49', 'SERVICE50', 'SERVICE51', 'SERVICE52', 'SERVICE53', 'SERVICE54', 'SERVICE55', 'SERVICE56',
          'SERVICE57', 'SERVICE58', 'SERVICE59', 'SERVICE60', 'SERVICE61', 'SERVICE62', 'SERVICE63'
        ],
        description: 'The value is a quoted-string that specifies a Rendition within the segments in the Media Playlist.  It MUST have one of the values: "CC1", "CC2", "CC3", "CC4", or "SERVICEn" where n MUST be an integer between 1 and 63 (e.g., "SERVICE3" or "SERVICE42").  The values "CC1", "CC2", "CC3", and "CC4" identify a Line 21 Data Services channel [CEA608].  The "SERVICE" values identify a Digital Television Closed Captioning [CEA708] service block number.'
      },
      {
        name: 'CHARACTERISTICS',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing one or more Uniform Type Identifiers [UTI] separated by comma (,) characters.  Each UTI indicates an individual characteristic of the Rendition.'
      },
      {
        name: 'CHANNELS',
        type: '<quoted-string>',
        description: 'The value is a quoted-string that specifies an ordered, backslash-separated ("/") list of parameters.  If the TYPE attribute is AUDIO, then the first parameter is a count of audio channels expressed as a decimal-integer, indicating the maximum number of independent, simultaneous audio channels present in any Media Segment in the Rendition.  For example, an AC-3 5.1 Rendition would have a CHANNELS="6" attribute.  No other CHANNELS parameters are currently defined.'
      }
    ],
    playlistType: 'manifest',
    description: 'The EXT-X-MEDIA tag is used to relate Media Playlists that contain alternative Renditions (Section 4.3.4.2.1) of the same content.  For example, three EXT-X-MEDIA tags can be used to identify audio-only Media Playlists that contain English, French, and Spanish Renditions of the same presentation.  Or, two EXT-X-MEDIA tags can be used to identify video-only Media Playlists that show two different camera angles.'
  },

  {
    name: '#EXT-X-STREAM-INF',
    // followed by <URI>
    type: '<attribute-list>',
    attributes: [
      {
        name: 'BANDWIDTH',
        type: '<decimal-integer>',
        required: true,
        description: 'The value is a decimal-integer of bits per second.  It represents the peak segment bit rate of the Variant Stream.'
      },
      {
        name: 'AVERAGE-BANDWIDTH',
        type: '<decimal-integer>',
        description: 'The value is a decimal-integer of bits per second.  It represents the average segment bit rate of the Variant Stream.'
      },
      {
        name: 'CODECS',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a comma-separated list of formats, where each format specifies a media sample type that is present in one or more Renditions specified by the Variant Stream. Valid format identifiers are those in the ISO Base Media File Format Name Space defined by "The \'Codecs\' and \'Profiles\' Parameters for "Bucket" Media Types" [RFC6381].'
      },
      {
        name: 'RESOLUTION',
        type: '<decimal-resolution>',
        description: 'The value is a decimal-resolution describing the optimal pixel resolution at which to display all the video in the Variant Stream.'
      },
      {
        name: 'FRAME-RATE',
        type: '<decimal-floating-point>',
        description: 'The value is a decimal-floating-point describing the maximum frame rate for all the video in the Variant Stream, rounded to three decimal places.'
      },
      {
        name: 'HDCP-LEVEL',
        type: '<enumerated-string>',
        enum: [
          'TYPE-0',
          'NONE'
        ],
        description: 'The value is an enumerated-string; valid strings are TYPE-0 and NONE.  This attribute is advisory; a value of TYPE-0 indicates that the Variant Stream could fail to play unless the output is protected by High-bandwidth Digital Content Protection (HDCP) Type 0 [HDCP] or equivalent.  A value of NONE indicates that the content does not require output copy protection.'
      },
      {
        name: 'AUDIO',
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        type: '<quoted-string>',
        description: 'The value is a quoted-string.  It MUST match the value of the GROUP-ID attribute of an EXT-X-MEDIA tag elsewhere in the Master Playlist whose TYPE attribute is AUDIO.  It indicates the set of audio Renditions that SHOULD be used when playing the presentation.'
      },
      {
        name: 'VIDEO',
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        type: '<quoted-string>',
        description: 'The value is a quoted-string.  It MUST match the value of the GROUP-ID attribute of an EXT-X-MEDIA tag elsewhere in the Master Playlist whose TYPE attribute is VIDEO.  It indicates the set of video Renditions that SHOULD be used when playing the presentation.'
      },
      {
        name: 'SUBTITLES',
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        type: '<quoted-string>',
        description: 'The value is a quoted-string.  It MUST match the value of the GROUP-ID attribute of an EXT-X-MEDIA tag elsewhere in the Master Playlist whose TYPE attribute is SUBTITLES.  It indicates the set of subtitle Renditions that can be used when playing the presentation.'
      },
      {
        name: 'CLOSED-CAPTIONS',
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        // CAN also be NONE
        type: '<quoted-string>',
        description: 'The value can be either a quoted-string or an enumerated-string with the value NONE.  If the value is a quoted-string, it MUST match the value of the GROUP-ID attribute of an EXT-X-MEDIA tag elsewhere in the Playlist whose TYPE attribute is CLOSED-CAPTIONS, and it indicates the set of closed-caption Renditions that can be used when playing the presentation.'
      },
      {
        name: 'PROGRAM-ID',
        type: '<decimal-integer>',
        maxVersion: 5,
        description: 'The value is a decimal-integer that uniquely identifies a particular presentation within the scope of the Playlist file.'
      }
    ],
    playlistType: 'manifest',
    appliesToNextUri: true,
    description: 'The EXT-X-STREAM-INF tag specifies a Variant Stream, which is a set of Renditions that can be combined to play the presentation.  The attributes of the tag provide information about the Variant Stream. The URI line that follows the EXT-X-STREAM-INF tag specifies a Media Playlist that carries a Rendition of the Variant Stream.  The URI line is REQUIRED.  Clients that do not support multiple video Renditions SHOULD play this Rendition.'
  },

  {
    name: '#EXT-X-I-FRAME-STREAM-INF',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'BANDWIDTH',
        type: '<decimal-integer>',
        required: true,
        description: 'The value is a decimal-integer of bits per second.  It represents the peak segment bit rate of the Variant Stream.'
      },
      {
        name: 'AVERAGE-BANDWIDTH',
        type: '<decimal-integer>',
        description: 'The value is a decimal-integer of bits per second.  It represents the average segment bit rate of the Variant Stream.'
      },
      {
        name: 'CODECS',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a comma-separated list of formats, where each format specifies a media sample type that is present in one or more Renditions specified by the Variant Stream. Valid format identifiers are those in the ISO Base Media File Format Name Space defined by "The \'Codecs\' and \'Profiles\' Parameters for "Bucket" Media Types" [RFC6381].'
      },
      {
        name: 'RESOLUTION',
        type: '<decimal-resolution>',
        description: 'The value is a decimal-resolution describing the optimal pixel resolution at which to display all the video in the Variant Stream.'
      },
      {
        name: 'HDCP-LEVEL',
        type: '<enumerated-string>',
        enum: [
          'TYPE-0',
          'NONE'
        ],
        description: 'The value is an enumerated-string; valid strings are TYPE-0 and NONE.  This attribute is advisory; a value of TYPE-0 indicates that the Variant Stream could fail to play unless the output is protected by High-bandwidth Digital Content Protection (HDCP) Type 0 [HDCP] or equivalent.  A value of NONE indicates that the content does not require output copy protection.'
      },
      {
        name: 'VIDEO',
        // enum w/ ctx.root.EXT-X-MEDIA.<one-of>.NAME
        type: '<quoted-string>',
        description: 'The value is a quoted-string.  It MUST match the value of the GROUP-ID attribute of an EXT-X-MEDIA tag elsewhere in the Master Playlist whose TYPE attribute is VIDEO.  It indicates the set of video Renditions that SHOULD be used when playing the presentation.'
      },
      {
        name: 'URI',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a URI that identifies the I-frame Media Playlist file.  That Playlist file MUST contain an EXT-X-I-FRAMES-ONLY tag.'
      },
      {
        name: 'PROGRAM-ID',
        type: '<decimal-integer>',
        maxVersion: 5,
        description: 'The value is a decimal-integer that uniquely identifies a particular presentation within the scope of the Playlist file.'
      }
    ],
    playlistType: 'manifest',
    description: 'The EXT-X-I-FRAME-STREAM-INF tag identifies a Media Playlist file containing the I-frames of a multimedia presentation.  It stands alone, in that it does not apply to a particular URI in the Master Playlist.'
  },

  {
    name: '#EXT-X-SESSION-DATA',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'DATA-ID',
        type: '<quoted-string>',
        required: true,
        description: 'The value of DATA-ID is a quoted-string that identifies a particular data value.  The DATA-ID SHOULD conform to a reverse DNS naming convention, such as "com.example.movie.title"; however, there is no central registration authority, so Playlist authors SHOULD take care to choose a value that is unlikely to collide with others.'
      },
      {
        name: 'VALUE',
        type: '<quoted-string>',
        description: 'VALUE is a quoted-string.  It contains the data identified by DATA-ID.  If the LANGUAGE is specified, VALUE SHOULD contain a human-readable string written in the specified language.'
      },
      {
        name: 'URI',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a URI.  The resource identified by the URI MUST be formatted as JSON [RFC7159]; otherwise, clients may fail to interpret the resource.'
      },
      {
        name: 'LANGUAGE',
        type: '<quoted-string>',
        description: 'The value is a quoted-string containing a language tag [RFC5646] that identifies the language of the VALUE.'
      }
    ],
    playlistType: 'manifest',
    description: 'The EXT-X-SESSION-DATA tag allows arbitrary session data to be carried in a Master Playlist.'
  },

  {
    name: '#EXT-X-SESSION-KEY',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'METHOD',
        type: '<enumerated-string>',
        required: true,
        enum: [
          'AES-128',
          'SAMPLE-AES'
        ],
        description: 'The value is an enumerated-string that specifies the encryption method.'
      },
      {
        name: 'URI',
        type: '<uri>',
        required: true,
        description: 'The value is a quoted-string containing a URI that specifies how to obtain the key.'
      },
      {
        name: 'IV',
        type: '<hexadecimal-sequence>',
        minVersion: 2,
        description: 'The value is a hexadecimal-sequence that specifies a 128-bit unsigned integer Initialization Vector to be used with the key.'
      },
      {
        name: 'KEYFORMAT',
        type: '<quoted-string>',
        minVersion: 5,
        description: 'The value is a quoted-string that specifies how the key is represented in the resource identified by the URI; see Section 5 for more detail.'
      },
      {
        name: 'KEYFORMATVERSIONS',
        type: '<quoted-string>',
        minVersion: 5,
        description: 'The value is a quoted-string containing one or more positive integers separated by the "/" character (for example, "1", "1/2", or "1/2/5").  If more than one version of a particular KEYFORMAT is defined, this attribute can be used to indicate which version(s) this instance complies with.'
      }
    ],
    playlistType: 'manifest',
    description: 'The EXT-X-SESSION-KEY tag allows encryption keys from Media Playlists to be specified in a Master Playlist.  This allows the client to preload these keys without having to read the Media Playlist(s) first.'
  },

  // BOTH
  {
    name: '#EXT-X-INDEPENDENT-SEGMENTS',
    type: null,
    playlistType: 'both',
    description: 'The EXT-X-INDEPENDENT-SEGMENTS tag indicates that all media samples in a Media Segment can be decoded without information from other segments.  It applies to every Media Segment in the Playlist.'
  },

  {
    name: '#EXT-X-START',
    type: '<attribute-list>',
    attributes: [
      {
        name: 'TIME-OFFSET',
        type: '<signed-decimal-floating-point>',
        required: true,
        description: 'The value of TIME-OFFSET is a signed-decimal-floating-point number of seconds.  A positive number indicates a time offset from the beginning of the Playlist.  A negative number indicates a negative time offset from the end of the last Media Segment in the Playlist.'
      },
      {
        name: 'PRECISE',
        type: '<enumerated-string>',
        enum: [
          'YES',
          'NO'
        ],
        default: 'NO',
        description: 'The value is an enumerated-string; valid strings are YES and NO. If the value is YES, clients SHOULD start playback at the Media Segment containing the TIME-OFFSET, but SHOULD NOT render media samples in that segment whose presentation times are prior to the TIME-OFFSET.  If the value is NO, clients SHOULD attempt to render every media sample in that segment.'
      }
    ],
    playlistType: 'both',
    description: 'The EXT-X-START tag indicates a preferred point at which to start playing a Playlist.  By default, clients SHOULD start playback at this point when beginning a playback session.'
  }
];

export default tagSpec;

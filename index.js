const tagsSpec = require('./hls_tag_spec');
const typesSpec = require('./hls_type_spec');

/*
const fs = require('fs');
const split2 = require('split2');

const parse = async (fileStream) => {
  const output = {};

  fileStream.pipe(split2())
  .on('data', lineMode(output))
  .on('close', function() {
    // destroy the file stream in case the split stream was destroyed
    file.destroy()
  });

  return output;
};

const parseFile = (fileName) => {
  const fileStream = fs.createReadStream(filename)

  return parse(fileStream);
};*/
/*
const gatherQuotedAttributes = (inArr) => {
  let inString = false;

  return inArr.reduce((arr, el, index) => {
    const last = arr[arr.length - 1];
    const hasQuote = el.indexOf('"') !== -1;
    const endsWithQuote = el.lastIndexOf('"') === el.length - 1;

    last.push(el);

    if ((hasQuote || inString) && !endsWithQuote) {
      inString = true;
      return arr;
    }

    if (index !== inArr.length - 1) {
      inString = false;
      arr.push([]);
    }

    return arr;
  },[[]]).map(a => a.join(','));
};
*/
//var stream = splitFile('my-file.txt')
const parseAttributes = (input) => {
  const commaSplit = input.split(',');
  const quotedCommaSplit = gatherQuotedAttributes(commaSplit);

  return quotedCommaSplit.map((el) => {
    const [name, value] = el.split('=');

    return {
      name: name.trim(),
      value
    };
  });
};

const parseTag = (input, output) => {
  let firstColon = input.indexOf(':');

  if (firstColon === -1) {
    firstColon = input.length;
  }
  const tag = input.slice(0, firstColon);
  const tagSpec = tagsSpec[tag];
  let value = null;

  // Copy spec properties to line
  Object.assign(output, tagSpec);

  if (firstColon !== input.length) {
    if (tagSpec.type === null) {
      throw new Error(`Tag "${output.name}" has no attributes.`);
    }
    value = input.slice(firstColon + 1);
    // output.attributes = parseAttributes(output.value);
  } else if (tagSpec.type !== null) {
    throw new Error(`Tag "${output.name}" has attributes but none were found.`);
  }
  // TODO: Handle default values

  if (value) {
    const type = typesSpec[tagSpec.type];
    type.dec(output, value, tagSpec);
  }
};
/*
const serializeAttributes = (attributes) => {
  return attributes.reduce((arr, el) => {
     arr.push(`${el.name}=${el.value}`);

     return arr;
  }, []).join(',');
};
*/
const serializeTag = (lineObj) => {
  const tagSpec = tagsSpec[lineObj.name];
  const type = typesSpec[tagSpec.type];

  if (type) {
    let valueString = type.enc('', lineObj, tagSpec);

    return `${lineObj.name}:${valueString}`;
  }

  return `${lineObj.name}`;
};

const lineToObj = {
  dec: (line) => {
    let lineObj = {};

    if (line.indexOf('#EXT') === 0) {
      // Found a tag!
      lineObj.lineType = 'tag';
      parseTag(line, lineObj);
    } else if (line.indexOf('#') === 0) {
      // Found a comment!
      lineObj.lineType = 'comment';
      lineObj.value = line;
    } else if (line.length === 0) {
      // Empty line
      lineObj.lineType = 'empty';
    } else {
      // URI!
      lineObj.lineType = 'uri';
      lineObj.value = line;
    }

    return lineObj;
  },
  enc: (lineObj) => {
    let str;

    switch(lineObj.lineType) {
      case 'tag': {
        str = serializeTag(lineObj);
        break;
      }
      case 'empty': {
        str = '';
        break;
      }
      default: {
        str = lineObj.value;
        break;
      }
    }

    return str;
  }
};

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
#EXT-X-BYTERANGE:44556@8353216
hls_450k_video.ts
#EXT-X-ENDLIST`;

const lineObjGroup = (lineObj) => {
  const groupedLines = {
    global:[],
    segments: []
  };

  lineObj.reduce((arr, obj) => {
    if (obj.lineType === 'tag' && !obj.segment) {
      arr.push(obj);
    }

    return arr;
  }, groupedLines.global);

  // todo:
  //   spread media-sequence?
  //   spread discontinuity-sequence?

  lineObj.reduce((arr, obj) => {
    let last = arr[arr.length - 1];

    if (!obj.segment && obj.lineType !== 'uri') {
      return arr;
    }

    if (!last || last.uri) {
      last = {};
      arr.push(last);
    }

    if (obj.lineType === 'tag' && obj.segment) {
      last[obj.name] = obj;
    } else if (obj.lineType === 'uri') {
      last.uri = obj.value;
    }

    return arr;
  }, groupedLines.segments);

  return groupedLines;
};

const obj = test1.split('\n').map(lineToObj.dec);
console.log(JSON.stringify(lineObjGroup(obj), null, '  '));
//console.log('<<', obj);
const out = obj.map(lineToObj.enc).join('\n');
//console.log('>>', out);
console.log(test1 === out);

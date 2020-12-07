export class IdentityType {
  regexp = /^([^\n]*)/;

  parse(string) {
    const matches = string.match(this.regexp);

    if (!matches) {
      return matches;
    }
    const justMatches = matches.slice(1);

    // Only send back capture groups
    justMatches.consumedChars = matches[0].length;
    return justMatches;
  }
  stringify(justMatches) {
    return justMatches.join('');
  }
}

export class IntegerType extends IdentityType {
  regexp = /^([0-9]{1,20})/;
}

export class UnsignedFloatingPointType extends IdentityType {
  regexp = /^([0-9]+\.?[0-9]*)/;
}

export class SignedFloatingPointType extends IdentityType {
  regexp = /^([-+]?[0-9]+\.?[0-9]*)/;
}

export class HexadecimalSequenceType extends IdentityType {
  regexp = /^(0[xX][0-9A-Fa-f]+)/;
}

export class DateTimeType extends IdentityType {
  regexp = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:(?:[+-]\d\d:\d\d)|Z))/;
}

export class EnumeratedType extends IdentityType {
  regexp = /^([^\s,"]+)/;
}

export class QuotedStringType extends IdentityType {
  regexp = /^"([^\n"]*)"/;

  stringify(justMatches) {
    return `"${super.stringify(justMatches)}"`;
  }
}

export class ByteRangeType extends IdentityType {
  regexp = /^([0-9]+)@?([0-9]*)/;

  stringify(justMatches) {
    // In byte-ranges, the "offset" paramter is optional
    return `${justMatches[0]}${!isNaN(justMatches[1]) ? '@' + justMatches[1] : ''}`;
  }
}

export class QuotedByteRangeType extends ByteRangeType {
  regexp = /^"([0-9]+)@?([0-9]*)"/;

  stringify(justMatches) {
    return `"${super.stringify(justMatches)}"`;
  }
}

export class ResolutionType extends IdentityType {
  regexp = /^([1-9][0-9]*)[xX]([1-9][0-9]*)/;

  stringify(justMatches) {
    return `${justMatches[0]}x${justMatches[1]}`;
  }
}

export class DurationType extends IdentityType {
  // We allow the comma optional here to allow for malformed m3u8s
  regexp = /^([0-9]+.?[0-9]*),?([^\n]*)/;

  stringify(justMatches) {
    // The "title" part of the extinf's duration is optional but the comma isn't!
    return `${justMatches[0]},${justMatches[1] || ''}`;
  }
}

// So the "fuzzy" type will attempt to match a regex in the order:
// quoted-string`
// `hexadecimal-string`
// `decimal-floating-point`
//
// This is something of a hack since we are setting the 'type' property
// of the node directly from here (the second match) and then using
// that type on serialization.
export class FuzzyType extends IdentityType {
  #quotedString = new QuotedStringType();
  #hexadecimalSequence = new HexadecimalSequenceType();
  #floatingPoint = new SignedFloatingPointType();

  parse(string) {
    let type = 'string';

    let justMatches = this.#quotedString.parse(string);

    if (!justMatches) {
      type = 'hexadecimal';
      justMatches = this.#hexadecimalSequence.parse(string);
    }

    if (!justMatches) {
      type = 'number';
      justMatches = this.#floatingPoint.parse(string);
    }

    if (!justMatches) {
      throw new Error('Could not find a suitable parser for an unknown type attribute!');
    }

    if (justMatches) {
      justMatches[1] = type;
    }

    return justMatches;
  }

  stringify(justMatches) {
    const type = justMatches[1];

    justMatches.length = 1;

    if (type === 'string') {
      return this.#quotedString.stringify(justMatches);
    }

    if (type === 'hexadecimal') {
      return this.#hexadecimalSequence.stringify(justMatches);
    }

    if (type === 'number') {
      return this.#floatingPoint.stringify(justMatches);
    }

    throw new Error(`Could not find a suitable serializer for an unknown type attribute (${type})!`);
  }
}

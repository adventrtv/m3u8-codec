// List of type-casting functions
export const identity = {
  toValue: (ctx, value, index, valuesArray) => value,
  fromValue: (ctx, value, index, valuesArray) => value
};

const checkEnum = (ctx, value, index, valuesArray) => {
  const enumValues = ctx ? ctx.enum : undefined;

  if (!enumValues) {
    throw new Error(`Type "${ctx.name}" does not specify a list of enum values.`);
  }
  if (enumValues.indexOf(value) === -1) {
    throw new Error(`Value "${value}"" not found in enum: ${ctx.name} => [${enumValues}].`);
  }

  return value;
};

export const validateEnum = {
  toValue: checkEnum,
  fromValue: checkEnum
};

export const dateCast = {
  toValue: (ctx, value, index, valuesArray) => new Date(value),
  fromValue: (ctx, value, index, valuesArray) => value.toISOString()
};

export const numberCast = {
  toValue: (ctx, value, index, valuesArray) => parseFloat(value),
  fromValue: (ctx, value, index, valuesArray) => value
};

export const hexCast = {
  toValue: (ctx, value, index, valuesArray) => {
    const matches = value.match(/^0[xX]([0-9a-fA-F]+)/);

    if (!matches) {
      throw new Error('Invalid hexadecimal sequence found!');
    }
    let stringWithout0x = matches[1];

    // Make sure the hexadecimal string is 0-padded to be divisible by 2
    if (stringWithout0x.length % 2 === 1) {
      stringWithout0x = '0' + stringWithout0x;
    }

    const byteString = stringWithout0x.match(/[0-9a-fA-F][0-9a-fA-F]/g);
    const byteArray = new Uint8Array(byteString.map(x => parseInt(x, 16)));

    return byteArray.buffer;
  },
  fromValue: (ctx, value, index, valuesArray) => {
    const byteArray = new Uint8Array(value);
    const stringValue = byteArray.reduce((p, c) => p + c.toString(16).padStart(2, '0'), '0x');

    return stringValue;
  }
};

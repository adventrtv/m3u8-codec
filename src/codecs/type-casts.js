// List of type-casting functions
export const identity = (v, ctx) => v;

export const validateEnum = (value, ctx) => {
  const enumValues = ctx ? ctx.enum : undefined;

  if (!enumValues) {
    throw new Error(`Type "${ctx.name}" does not specify a list of enum values.`);
  }
  if (enumValues.indexOf(value) === -1) {
    throw new Error(`Value "${value}"" not found in enum: ${ctx.name} => [${enumValues}].`);
  }

  return value;
};

export const parseDate = (value, ctx) => new Date(value);

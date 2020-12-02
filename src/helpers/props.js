export const getProperty = (obj, propArray) => {
  return propArray.reduce((subObj, prop) => {
    if (subObj) {
      return subObj[prop];
    }
    return subObj;
  }, obj);
};

export const setProperty = (obj, propArray, value) => {
  propArray.reduce((subObj, prop, index) => {
    if (index === propArray.length - 1) {
      subObj[prop] = value;
      return;
    }
    subObj[prop] = subObj[prop] || {};

    return subObj[prop];
  }, obj);

  return obj;
};

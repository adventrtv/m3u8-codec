const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    browserstackLaunchers(launchers) {
      delete launchers.bsIE11Win10;
      return launchers;
      // return { bsIE11Win10: launchers.bsIE11Win10 };
    }
  };

  config = generate(config, options);
  // any other custom stuff not supported by options here!
  return config;
};

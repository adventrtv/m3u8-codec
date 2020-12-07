const generate = require('videojs-generate-rollup-config');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {
  input: 'src/index.js',
  babel(bOpts) {
    bOpts.plugins.push(['@babel/plugin-proposal-class-properties']);
    bOpts.plugins.push(['@babel/plugin-proposal-private-methods']);
    bOpts.plugins.push(['@babel/plugin-proposal-export-default-from']);

    return bOpts;
  },
  plugins(pOpts) {
    // Re-order babel and commonjs so that babel happens FIRST (to support experimental ES6 features)
    ['browser', 'modules', 'test'].forEach((env) => {
      if (!pOpts[env]) {
        return;
      }
      const commonjsIdx = pOpts[env].indexOf('commonjs');

      if (commonjsIdx === -1) {
        return;
      }

      const babelIdx = pOpts[env].indexOf('babel');

      pOpts[env].splice(babelIdx, 1);
      pOpts[env] = [pOpts[env].slice(0, commonjsIdx), 'babel', pOpts[env].slice(commonjsIdx)].flat();
    });

    return pOpts;
  }
};

const config = generate(options);

if (config.builds.test) {
  config.builds.test.output[0].format = 'umd';
}

// Add additonal builds/customization here!

// export the builds to rollup
export default Object.values(config.builds);

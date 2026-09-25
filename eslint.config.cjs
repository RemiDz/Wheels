const globals = require('globals');

module.exports = [{
  files: ['script.js', 'playback-scheduler.js', 'bowl-capture.js', 'service-worker.js'],
  languageOptions: {
    ecmaVersion: 'latest', sourceType: 'script',
    globals: { ...globals.browser, ...globals.serviceworker, PlaybackScheduler: 'readonly', BowlAudio: 'readonly' },
  },
  rules: {
    'no-undef': 'error', 'no-dupe-args': 'error', 'no-dupe-keys': 'error',
    'no-unreachable': 'error', 'no-constant-condition': 'error',
    'no-unsafe-optional-chaining': 'error', 'valid-typeof': 'error',
  },
}];

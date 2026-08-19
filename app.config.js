// Dynamic Expo config. The base configuration still lives in app.json — Expo
// loads it first and passes it in as `config`, and we extend it here so we can
// inject runtime values (like the RevenueCat keys) via the `extra` block.
//
// Docs: https://docs.expo.dev/versions/v54.0.0/config/app/

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    revenueCat: {
      // For now both platforms use the RevenueCat test key.
      //
      // To go live, swap these for the real platform-specific public SDK keys
      // from the RevenueCat dashboard (Project > API keys):
      //   ios:     'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      //   android: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      ios: 'appl_PWnvXPUzhlLOeZmmIVqvXLLVNBB',
      android: 'goog_StczLPVxnFIeNdtcFrAbfXexMvg',
    },
  },
});

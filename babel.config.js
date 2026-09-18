module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-worklets/plugin',
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        allowlist: [
          'PUBLIC_API_BASE_URL',
          'EXPO_PUBLIC_LOCAL_PROFILE_ID',
        ],
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};

module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    'nativewind/babel'
  ],
  plugins: [
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    'react-native-reanimated/plugin',
  ],
};

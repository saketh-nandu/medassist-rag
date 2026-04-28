const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On web, stub out react-native-webview (it's native-only)
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-webview') {
    return {
      filePath: require.resolve('./webview-web-stub.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

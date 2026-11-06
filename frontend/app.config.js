// Dynamic Expo config: app.json stays the static source of truth; this file only
// adds a build-time guard so an EAS *production* build can never ship with a
// missing, http://, localhost, or home-network API URL.
const { getProductionApiUrlError } = require('./src/constants/apiUrlPolicy');

module.exports = ({ config }) => {
  // EAS_BUILD is set on EAS build workers; EAS_BUILD_PROFILE is the eas.json profile.
  // Enforced only there, so local dev (`expo start`, which loads frontend/.env) is untouched.
  const isEasProductionBuild =
    process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PROFILE === 'production';

  if (isEasProductionBuild) {
    const error = getProductionApiUrlError(process.env.EXPO_PUBLIC_API_URL);
    if (error) {
      throw new Error(
        `${error}\nSet it for the EAS "production" environment, e.g.:\n` +
          '  eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://api.livadra.com --visibility plaintext',
      );
    }
  }

  return config;
};

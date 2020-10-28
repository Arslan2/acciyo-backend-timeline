const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  DIFFBOT_TOKEN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_CONNECTION,
  AUTH0_BASE_URL,
  GATEWAY_API_KEY
} = process.env;
/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {
  /***************************************************************************
   *                                                                          *
   * Any other custom config this Sails app should use during development.    *
   *                                                                          *
   ***************************************************************************/
  // mailgunDomain: 'transactional-mail.example.com',
  // mailgunSecret: 'key-testkeyb183848139913858e8abd9a3',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

  diffbot: {
    token: DIFFBOT_TOKEN,
    url: 'https://api.diffbot.com/v3/article'
  },

  aws: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION || 'us-east-1',
    gatewayKey: GATEWAY_API_KEY
  },

  auth0: {
    clientId: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    audience: AUTH0_AUDIENCE,
    baseUrl: AUTH0_BASE_URL || 'https://acciyo.auth0.com',
    connection: AUTH0_CONNECTION,
    grantType: 'http://auth0.com/oauth/grant-type/password-realm'
  }
};

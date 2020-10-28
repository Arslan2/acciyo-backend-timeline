const jwt = require('jsonwebtoken');
const config = sails.config.custom.auth0;

/**
 * Policy to get user information from token to be accessible inside actions and controllers.
 * @param  {object} req - sails request object.
 * @param  {object} res - sails response object.
 * @param  {function} next - sails next function.
 */

module.exports = function(req, res, next) {
  let token = req.headers.Authorization || req.headers.authorization || '';
  if (token.indexOf('Bearer ') === 0) {
    token = token.replace('Bearer ', '');
    try {
      const user = jwt.verify(token, config.clientSecret);
      req.user = user; // now it will be available to controllers and actions in request object
      return next();
    } catch (err) {
      console.log(err);
      return next();
    }
  }
  return next();
};

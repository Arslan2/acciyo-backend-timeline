/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */
const env = process.env.NODE_ENV;

module.exports.routes = {
  // 'POST /sign-in': 'Auth/sign-in',
  // 'POST /create-account': 'Auth/sign-up',
  ...(env !== 'production'
    ? {
        'GET /swagger/definition': 'Swagger.definition'
      }
    : {}),
  // 'POST /reset-user-password': 'Auth/forgot-pw',
  'POST /articles': 'Article/timeline',
  'GET /article/details/:id': 'Article/article-details',
  'POST /article': 'Article/create',
  // 'GET /sign-in/google': 'Auth/google-sign-in',
  // 'GET /check-user': 'Auth/check-user-exists',
  'GET /test/:id': 'Article/test',
  'GET /validurl': 'Article/url-is-news-site',
  'POST /scrape_article': 'Article/scrape-site',
  'GET /onboarding-url': 'Article/onboarder',
  'POST /delete-article': 'Article/delete',
  'POST /onboarding-change-url': 'Article/change-onboarding',
  'POST /addSite': 'Article/add-site',
  'POST /election/issues': 'Article/election-timeline',
  'GET /test/set': 'Test/set-job',
  'POST /test/get': 'Test/get-job',
  'POST /test/removeJob': 'Test/remove-job',
  'GET /test/clear': 'Test/empty-queue',
  'GET /test/clean-recent': 'Test/clean-recent'
};

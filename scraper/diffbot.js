const request = require('request');

const config = sails.config.custom;

/**
 * Returns Metadata of page by requesting diffbot's url using access token
 * @param  {string} url - url of page whose metadata is required.
 */

module.exports = function(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: config.diffbot.url,
      headers: { 'content-type': 'application/json' },
      qs: {
        token: config.diffbot.token,
        url: url,
        norender: true // optimize diffbot metadata extraction
      },
      json: true
    };
    request(options, (error, response, body) => {
      if (error) {
        console.log('there was a diffbot error');
        return reject(error); //rejects if there is error
      }
      if (body.objects && body.objects.length) {
        // extract required meta information
        const {
          author = '',
          authorUrl = '',
          humanLanguage: language,
          text,
          date: publishedAt,
          title,
          tags
        } = body.objects[0];

        return resolve({
          author,
          authorUrl,
          language,
          body: text,
          publishedAt,
          title,
          categories: (tags && tags.map(tag => tag.label)) || []
        });
      }
      console.log('about to reject because request failed in diffbot');
      return reject('No Articles Found'); //reject if not metadata found
    });
  });
};

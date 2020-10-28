var fs = require('fs');
var path = require('path');
var util = require('util');
module.exports = {
  friendlyName: 'Onboarding Manager',
  description: 'Returns data and performs services necessary for onboarding process',
  inputs: {},
  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response when there is data to return.'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Failure to return data'
    }
  },
  fn: async function(inputs, exits) {
    if (true) {
      let url = await getOnboardingUrl();
      if (url) {
        return exits.success(url);
      } else {
        return exits.success(
          'https://www.washingtonpost.com/world/europe/as-flames-engulfed-notre-dame-a-fire-bridge-chaplain-helped-save-the-treasures-inside/2019/04/16/9b7b8fd8-5fcc-11e9-bf24-db4b9fb62aa2_story.html'
        );
      }
    } else {
      return exits.serverError('https://www.acciyo.com');
    }
  }
};

async function getOnboardingUrl() {
  const filePath = path.join('data', 'onboarding.csv');
  const readf = util.promisify(fs.readFile);
  try {
    let onboardingDetails = await readf(filePath, 'utf-8');
    let onboardingArticle = onboardingDetails;
    console.log('onboarding Article: ', onboardingArticle);
    return onboardingArticle;
  } catch (err) {
    return 'https://www.washingtonpost.com/world/europe/as-flames-engulfed-notre-dame-a-fire-bridge-chaplain-helped-save-the-treasures-inside/2019/04/16/9b7b8fd8-5fcc-11e9-bf24-db4b9fb62aa2_story.html';
  }
}

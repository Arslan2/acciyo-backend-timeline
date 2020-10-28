module.exports = {
  friendlyName: 'Delete Article and Associated Data',

  description: 'Deletes article and its associated data given url and/or id',

  inputs: {
    urls: {
      description: 'Array of article urls to delete',
      type: 'json',
      required: false
    },
    ids: {
      description: 'Array of article ids to delete',
      type: 'json',
      required: false
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'URL VALID'
    },
    failure: {
      responseType: 'ok',
      description: 'URL NOT VALID'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    console.log('about to delete: ', inputs);
    //if both ids and urls are passed to inputs, function will prioritize deleting specified ids and ignore urls passed through.
    try {
      let res = await Article.managementMethods.deleteArticle(inputs);
      return exits.success(JSON.stringify(res));
    } catch (err) {
      console.log('error trying to delete inputs: ', inputs);
      console.log(err);
      return exits.failure(JSON.stringify(err));
    }
  }
};

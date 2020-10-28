module.exports = {
  friendlyName: 'GetArticleData',

  description: 'Provide article data ',

  inputs: {
    id: {
      description: 'Id of acciyo article whose data is required.',
      type: 'string',
      required: true
    }
  },
  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response if article is found.'
    },

    notFound: {
      responseType: 'notFound',
      description: 'Not Found response if no article is found'
    },

    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function({ id }, exits) {
    console.log('article details requested for id: ', id);
    try {
      const article = await Article.findOne({ id })
        .populate('authors')
        .populate('publishers');
      if (article) {
        return exits.success(article);
      }
      return exits.notFound();
    } catch (err) {
      return exits.serverError();
    }
  }
};

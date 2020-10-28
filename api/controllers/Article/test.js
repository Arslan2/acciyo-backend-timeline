module.exports = {
  friendlyName: 'GetArticleData',

  description: 'Provide article data ',

  inputs: {
    id: {
      description: 'Id of acciyo article whose data is required.',
      type: 'string',
      required: false,
      in: 'path'
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
    try {
      if (!id) {
        id = '412ed9f0-bd9f-11e9-a247-e5c6fd1df3ea';
      }

      const article = await Article.find({ id })
        .populate('authors')
        .populate('publisher');

      if (article) {
        return exits.success(article);
      } else {
        return exits.notFound();
      }
    } catch (err) {
      return exits.serverError();
    }
  }
};

module.exports = {
  friendlyName: 'Check if URL is news site',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {},
  exits: {
    success: {
      responseType: 'ok',
      description: 'URL VALID'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    console.log('CLEAR Q CALLED');
    try {
      let j = await testQueue.empty();

      return exits.success(j);
    } catch (err) {
      return exits.serverError(err);
    }
  }
};

module.exports = {
  friendlyName: 'Check if URL is news site',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {
    jobid: {
      description: 'url to check for',
      type: 'string',
      required: true
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
    console.log('GET-JOB CALLED');
    try {
      let cleaned = await testQueue.clean(10000);

      return exits.success(cleaned);
    } catch (err) {
      return exits.serverError(err);
    }
  }
};

module.exports = {
  friendlyName: 'Check if URL is news site',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {},

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
    console.log('SET JOB CALLED');
    try {
      let j = await testQueue.add({ test: 'vivian' });
      console.log('j : ', j);
      return exits.success(j.id);
    } catch (e) {
      return exits.serverError(e);
    }
  }
};

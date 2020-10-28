module.exports = {
  friendlyName: 'GetArticleData',

  description: 'Provide article data ',

  inputs: {
    jobid: {
      description: 'Id of job to remove from queue',
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

  fn: async function({ jobid }, exits) {
    try {
      let job = await testQueue.getJob(jobid);
      job.remove();
      return exits.success();
    } catch (err) {
      return exits.serverError(err);
    }
  }
};

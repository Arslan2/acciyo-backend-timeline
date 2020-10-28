module.exports = {
  friendlyName: 'Article timeline',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {
    issues: {
      description: 'List of issues for which we want to generate a timeline.',
      type: 'json',
      required: true,
      in: 'body'
    },
    candidates: {
      description: 'List of issues for which we want to generate a timeline.',
      type: 'json',
      required: true,
      in: 'body'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response when articles are found for the current url.'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    let issueArticles = await Article.searchMethods.election_issue_search(inputs.issues, inputs.candidates);
    console.log('returning issues');
    return exits.success(JSON.stringify(issueArticles));
  }
}; // end of module.exports

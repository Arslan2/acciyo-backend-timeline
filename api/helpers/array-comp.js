module.exports = {
  friendlyName: 'Compare Keyword Arrays',

  description: 'Checks if target keywords are sufficiently matched with candidate keywords',

  inputs: {
    targetKeywords: {
      type: 'ref',
      example: [1, 2, 3],
      description: 'The target keywords array',
      required: true
    },
    articleKeywords: {
      type: 'ref',
      example: [1, 2, 3],
      description: 'The candidate article keywords array',
      required: true
    },
    sectionSize: {
      type: 'ref',
      example: 5,
      description: 'The subsection of the candidate keywords [0:subsection] that should contain the target keywords',
      required: true
    }
  },

  fn: async function(inputs, exits) {
    const queryKeywords = inputs.targetKeywords;
    const unsortedKeywords = inputs.articleKeywords;
    const section_size = inputs.sectionSize;
    //unsortedKeywords are the keywords that are being questions (in their origin state and positions)
    //queryKeywords are the keywords that were used to query the article for the unsortedKeywords
    for (var i = 0; i < queryKeywords.length; i++) {
      //for each keyword in the query, we want to check that it is within the unsortedKeywords[0:section_size] subarray
      let qk = queryKeywords[i];
      if (unsortedKeywords.indexOf(qk) > section_size) {
        return exits.success(false);
      }
    }
    return exits.success(true);
  }
};

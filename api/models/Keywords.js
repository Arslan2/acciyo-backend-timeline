var query =
  "SELECT * FROM keywords WHERE keywords.keywords ~ '.*(trump)[,s]?' and keywords.keywords ~ '.*(hawaii)[,s]?'";

const uuid = require('uuid').v4;
module.exports = {
  attributes: {
    articleId: {
      model: 'article',
      required: true
    },
    keywords: {
      type: 'json',
      required: true
    },
    method: {
      type: 'string'
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    createdAt: {
      type: 'ref',
      columnType: 'datetime'
    }
  },
  tableName: 'keywords',
  searchMethods: {
    searchKeywords
  },
  /**
   * hook that will be executed before create
   * @param  {Object} valuesToSet - model object
   * @param  {Function} proceed - callback
   */
  beforeCreate: function(valuesToSet, proceed) {
    valuesToSet.id = uuid().trim();
    return proceed();
  }
};

async function searchKeywords(terms, articleId) {}

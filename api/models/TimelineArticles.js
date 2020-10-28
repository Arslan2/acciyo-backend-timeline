// var query =
//     "SELECT * FROM keywords WHERE keywords.keywords ~ '.*(trump)[,s]?' and keywords.keywords ~ '.*(hawaii)[,s]?'";

const uuid = require('uuid').v4;
module.exports = {
  attributes: {
    id: {
      type: 'string',
      required: true
    },
    timelineId: {
      type: 'string',
      required: true
    },
    articleId: {
      type: 'string',
      required: true
    },
    createdAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    updatedAt: false
  },
  tableName: 'timeline_articles',
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

// var query =
//     "SELECT * FROM keywords WHERE keywords.keywords ~ '.*(trump)[,s]?' and keywords.keywords ~ '.*(hawaii)[,s]?'";

const uuid = require('uuid').v4;
module.exports = {
  attributes: {
    id: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      required: true
    },
    method: {
      type: 'string'
    },
    createdAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    creatorId: {
      model: 'article',
      required: false
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime',
      required: false
    }
    //oroginally had updatedAt: false because we did't have that field but we actually need it to know if more articles need to be searched and saved to this timeline.
  },
  tableName: 'timelines',
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

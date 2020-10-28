/**
 * publishers.js
 *
 * @description :: publishers model to store the  data of the publisher of webpage or article.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const uuid = require('uuid').v1;
module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: false
    },
    url: {
      type: 'string',
      required: true,
      unique: true,
      allowNull: false
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime'
    }
  },
  tableName: 'publishers',
  /**
   * hook that will be executed before create
   * @param  {Object} valuesToSet - model object
   * @param  {Function} proceed - callback
   */
  beforeCreate: function(valuesToSet, proceed) {
    valuesToSet.id = uuid().trim();
    valuesToSet.name = valuesToSet.name.trim();
    valuesToSet.url = valuesToSet.url.trim();
    return proceed();
  }
};

/**
 * users.js
 *
 * @description :: User model to store the data for registered users.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const uuid = require('uuid').v1;
module.exports = {
  attributes: {
    email: {
      type: 'string',
      required: true,
      unique: true
    },
    consentedToGdprTrackingAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    consentedToTransactionalCommunicationAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    consentedToMarketingCommunicationAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime',
      autoUpdatedAt: true
    }
  },
  tableName: 'users',
  /**
   * hook that will be executed before create
   * @param  {Object} valuesToSet - model object
   * @param  {Function} proceed - callback
   */
  beforeCreate: function(valuesToSet, proceed) {
    valuesToSet.id = uuid();
    return proceed();
  }
};

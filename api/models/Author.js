/**
 * authors.js
 *
 * @description :: authors model to store the data about the author of a webapage or article  .
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const uuid = require('uuid').v1;
module.exports = {
  attributes: {
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },
    articles: {
      collection: 'article',
      via: 'author',
      through: 'articleAuthor'
    },
    url: {
      type: 'string'
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime',
      required: false
    }
  },
  tableName: 'authors',
  /**
removed association: 
     articles: {
     collection: 'article',
     via: 'author',
     through: 'articleAuthor'
     },
   * hook that will be executed before create
   * @param  {Object} valuesToSet - model object
   * @param  {Function} proceed - callback
   */
  beforeCreate: function(valuesToSet, proceed) {
    valuesToSet.id = uuid();
    return proceed();
  }
};

/*
  articles: {
  collection: 'article',
  via: 'author',
  through: 'articleAuthor'
  },

 */

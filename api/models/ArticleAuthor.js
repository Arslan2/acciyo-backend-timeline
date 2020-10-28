/**
 * articleauthors.js
 *
 * @description :: authorarticles to define the many to many relationship b/w  articles and authors model.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const uuid = require('uuid').v1;
module.exports = {
  attributes: {
    author: {
      model: 'author',
      columnName: 'authorId'
    },
    article: {
      model: 'article',
      columnName: 'articleId'
    }
  },
  updatedAt: {
    type: 'ref',
    columnType: 'datetime'
  },

  tableName: 'articles_authors',
  modifyMethods: {
    generateId,
    setId
  },
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

async function generateId() {
  return uuid();
}
async function setId(articleAuthorData) {
  let newId = uuid();
  await ArticleAuthor.update({ author: articleAuthorData.author, article: articleAuthorData.article }, { id: newId });
}

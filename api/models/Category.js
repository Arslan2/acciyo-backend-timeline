const uuid = require('uuid').v1;
module.exports = {
  attributes: {
    id: {
      type: 'string',
      required: true
    },
    category: {
      type: 'string',
      allowNull: true
    },
    articleId: {
      model: 'article',
      required: true
    },
    createdAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    method: {
      type: 'string'
    }
  },
  tableName: 'category'
};

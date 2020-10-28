module.exports = {
  attributes: {
    domain: {
      type: 'string',
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
    requestsCount: {
      type: 'number',
      columnType: 'INTEGER',
      required: true
    }
  },
  tableName: 'site_requests'
};

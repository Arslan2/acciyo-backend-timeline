module.exports = {
  friendlyName: 'request client ip',

  description: 'Returns the client request ip address/location',

  inputs: {
    req: {
      type: 'ref',
      description: 'The current incoming request (req).',
      required: true
    }
  },

  exits: {
    success: {
      description: 'Success response when articles are found for the current url.'
    },
    serverError: {
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    try {
      var result = inputs.req.ip;
      if (result === undefined) {
        raise('no ip');
      }
      return exits.success(result);
    } catch (err) {
      console.log(err);
      return exits.success(result);
    }

    return exits.serverError('yikes');
  }
};

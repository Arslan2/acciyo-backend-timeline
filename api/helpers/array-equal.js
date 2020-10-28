module.exports = {
  friendlyName: 'Compare Arrays',

  description: 'Function to check if arrays are similar',

  inputs: {
    array1: {
      type: 'ref',
      example: [1, 2, 3],
      description: 'The first array',
      required: true
    },
    array2: {
      type: 'ref',
      example: [1, 2, 3],
      description: 'The second array',
      required: true
    }
  },

  fn: async function(inputs, exits) {
    if (inputs.array1.length !== inputs.array2.length) {
      return exits.success(false);
    }
    //for ensuring arrays of thhe same exact keywords but slight different orders:
    const array1 = inputs.array1.sort();
    const array2 = inputs.array2.sort();
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return exits.success(false);
      }
    }
    return exits.success(true);
  }
};

var fs = require('fs');
var path = require('path');
var util = require('util');
module.exports = {
  friendlyName: 'Change Onboarding Details',
  description: 'Returns data and performs services necessary for onboarding process',
  inputs: {
    data: {
      description: 'new details for onboarding',
      type: 'json',
      required: true,
      in: 'body'
    }
  },
  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response when there is data to return.'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Failure to return data'
    }
  },
  fn: async function(inputs, exits) {
    console.log('inputs: ', inputs);
    const new_url = inputs.data.new_url;
    const filePath = path.join('data', 'onboarding.csv');
    const writeF = util.promisify(fs.writeFile); //writeFile OVERWRITES
    const readF = util.promisify(fs.readFile); //get old url and save in temp just in case we need to rollback
    const oldUrl = await readF(filePath, 'utf-8');

    try {
      //first we write old url to our temp file.
      let tempPath = path.join('data', 'onboarding_temp.csv');
      let tempWriteErr = await writeF(tempPath, oldUrl, 'utf-8');

      //then we write the new url to our old onboarding.csv file
      let newUrlErr = await writeF(filePath, new_url, 'utf-8');
      if (tempWriteErr || newUrlErr) {
        return exits.serverError(
          JSON.stringify({
            message: 'Failed to write to either temp or onboarding.csv',
            err: true,
            tempWrite: tempWriteErr.toString(),
            newUrlWrite: newUrlErr.toString()
          })
        );
      }
      return exits.success(JSON.stringify({ message: 'successful write', err: false }));
      //return true
    } catch (err) {
      return exits.serverError({ message: 'failed to write to files', err });
    }
  }
};

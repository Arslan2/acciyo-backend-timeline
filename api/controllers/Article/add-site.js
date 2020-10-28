module.exports = {
  friendlyName: 'addSite',

  description: 'Returns an object that indicates success of adding to list.',

  inputs: {
    domain: {
      description: 'domain address',
      type: 'string',
      required: true,
      in: 'body'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'added to list / already exists'
    },
    failure: {
      responseType: 'ok',
      description: 'failed to add to list'
    }
  },

  fn: async function(inputs, exits) {
    try {
      let dom = extractDomain(inputs.domain).generic_url;
      const date = new Date().toISOString();
      const foundSite = await SiteRequest.findOne({ domain: dom });
      if (foundSite) {
        let reqCount = parseInt(foundSite.requestsCount) + 1;
        const updateSite = await SiteRequest.updateOne({ domain: dom }).set({
          requestsCount: reqCount,
          updatedAt: date
        });
        if (updateSite) {
          return exits.success(JSON.stringify({ successfullyAdded: true, successfullyCounted: true, error: false }));
        } else {
          return exits.success(JSON.stringify({ successfullyAdded: true, successfullyCounted: false, error: false }));
        }
      } else {
        try {
          await SiteRequest.create({ domain: dom, requestsCount: 1, createdAt: date });
          return exits.success(JSON.stringify({ successfullyAdded: true, successfullyCounted: true, error: false }));
        } catch (err) {
          return exits.failure(
            JSON.stringify({ successfullyAdded: false, successfullyCounted: false, error: err.toString() })
          );
        }
      }
    } catch (err) {
      console.log('ERROR in add site: ', err);
      return exits.failure(
        JSON.stringify({ successfullyAdded: false, successfullyCounted: false, error: err.toString() })
      );
    }
  }
};

function extractDomain(originalUrl) {
  let noHttp = originalUrl.replace(/(http(s)?)(\:\/\/)/g, '');
  let noWWW = noHttp.replace(/(www\.)/, '');
  let noParamsIndex = noWWW.search(/\w\/[\w\s\_\d\-\?\=\+]+[\/\?\.]?/g);
  if (noParamsIndex < 0) {
    return { generic_url: noWWW, is_homepage: true };
  }
  let paramSubstring = noWWW.substring(noParamsIndex + 1);
  let url = noWWW.replace(paramSubstring, '');
  return { generic_url: url, is_homepage: false };
}

/**
 * SwaggerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const routes = require('../../config/routes').routes;
const policies = require('../../config/policies').policies;

// reponse codes mapping for sails response types
const responseTypes = {
  created: 201,
  forbidden: 403,
  serverError: 500,
  ok: 200,
  notFound: 404
};

/**
 * Returns body parameter for an action
 * @param  {object} inputs - Inputs required by an action
 */
function getBodyParams(inputs) {
  var properties = Object.keys(inputs).filter(k => inputs[k].in === 'body');
  if (properties.length) {
    return [
      {
        name: 'body',
        required: true,
        in: 'body',
        schema: {
          type: 'object',
          properties: properties.reduce((acc, k) => {
            acc[k] = inputs[k];
            return acc;
          }, {})
        }
      }
    ];
  }
  return [];
}
/**
 * Returns path parameters for an action
 * @param  {object} inputs - Inputs required by an action
 */

function getPathParms(inputs) {
  return Object.keys(inputs)
    .filter(k => inputs[k].in === 'path' || inputs[k].in === 'query')
    .map(k => {
      var paramDef = inputs[k];
      return {
        name: k,
        ...paramDef
      };
    });
}
/**
 * Replace express url into swagger compatible url.
 * @param  {string} str - url
 * @param  {array} found=[]  - optional, only used in recursive calls
 */
function repl(str, found = []) {
  var regex = /{([^}]+)}/g;
  var curMatch;
  let index = str.indexOf(':');
  if (index !== -1) {
    str = str.replace(':', '{');
    let nextcolon = str.substring(index, str.length).indexOf('/');
    if (nextcolon !== -1) {
      index = index + nextcolon;
      str = replaceAt(str, index, '}');
      while ((curMatch = regex.exec(str))) {
        found.push(curMatch[1]);
      }
      return repl(str, found);
    } else {
      str = str.concat('}');
      while ((curMatch = regex.exec(str))) {
        found.push(curMatch[1]);
      }
      return {
        str,
        found
      };
    }
  }
  return {
    str,
    found
  };
}

const paths = {};
const policyName = 'getUserFromToken'; // policy to get token

const actionsWithPolicy = Object.keys(policies).filter(key => policies[key].find(policy => policyName === policy));

Object.keys(routes)
  .filter(routeName => !routeName.includes('swagger'))
  .forEach(routeName => {
    const method = routeName.split(' ')[0];
    let url = routeName.split(' ')[1];
    const actionTag = routes[routeName].split('/')[0];
    url = repl(url).str;
    const tags = [actionTag];
    const actionPath = `./${routes[routeName]}`;
    const action = require(actionPath);
    paths[url] = {
      [method.toLowerCase()]: {
        tags,
        description: action.description,
        consumes: ['application/json'],
        produces: ['application/json'],
        parameters: null,
        responses: Object.keys(action.exits).reduce((acc, exitKey) => {
          var exit = action.exits[exitKey];
          acc[responseTypes[exit.responseType]] = {
            description: exit.description
          };
          return acc;
        }, {})
      }
    };
    paths[url][method.toLowerCase()].parameters = [...getBodyParams(action.inputs), ...getPathParms(action.inputs)];
    if (actionsWithPolicy.find(action => action.indexOf(actionTag.toLowerCase()) === 0)) {
      paths[url][method.toLowerCase()].security = { api_key: [] };
    }
  });

const swaggerDef = {
  swagger: '2.0',
  info: {
    title: 'Acciyo API'
  },
  host: 'localhost:1337', // dev environment config. It'll be replaced in future for every environment.
  schemes: ['http'],
  paths,
  securityDefinitions: {
    api_key: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    }
  }
};

module.exports = {
  /**
   * Returns swagger definition in json format.
   * @param  {object} req - sails request object
   * @param  {object} res - sails response object
   */
  definition: function(req, res) {
    res.json(swaggerDef);
  }
};

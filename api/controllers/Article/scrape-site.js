//const { gatewayAPI } = require('../../../consumers/awsGateway');
var axios = require('axios');
module.exports = {
  friendlyName: 'Article scraper',
  description: 'Sends request to AWS API Gateway to scrape article and return here for saving',
  inputs: {
    data: {
      description: 'document html for article',
      type: 'string',
      allowNull: true,
      in: 'body'
    },
    url: {
      description: 'url for article',
      type: 'string',
      required: true,
      in: 'body'
    }
  },
  exits: {
    success: {
      responseType: 'ok',
      description: 'Success if scrape returned article data for saving'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Could not scrape site properly'
    }
  },

  fn: async function({ data, url }, exits) {
    let awsUrl = 'https://ypdkrem3o1.execute-api.us-east-1.amazonaws.com/default/scrape_incoming_2';

    //let awsUrl = 'http://keyword-lb-2127467146.us-east-1.elb.amazonaws.com:8001/scrape_incoming';
    // let awsUrl = 'https://morgfos7k4.execute-api.us-east-1.amazonaws.com/test/scrape_incoming';
    //"https://morgfos7k4.execute-api.us-east-1.amazonaws.com/default/scrape_incoming";
    let key = 'IpvXF3Ujs05NCNptkkjL31rDHZK5g5XJ9z7OjTFv';
    console.log('data length : ', data.length);
    console.log('url: ', url);
    try {
      const options = {
        method: 'POST',
        url: awsUrl,
        data: JSON.stringify({ data: data, url: url }),
        headers: { 'content-type': 'application/json' }
      };

      axios(options)
        .then(response => {
          let articleData = response.data;
          console.log('articleData: ' + articleData);
          return exits.success(articleData);
        })
        .catch(e => {
          console.log('e: ', e);
        });
      //console.log('error: ', err);
      //console.log('response: ', resp);
      //let scrapedArticle = await gatewayAPI.scrape({data,url});
    } catch (err) {
      return exits.serverError(err);
    }
  }
};

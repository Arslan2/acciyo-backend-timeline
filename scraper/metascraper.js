//const metascraper = require('metascraper')([require('metascraper-publisher')()]);
const axios = require('axios');
//const request = require('request');

/**
 * Get Publisher Name Using MetaScraper
 * @param  {string} url - url of page to scrape
 */

module.exports = async function(html, url) {
  //let awsUrl = 'https://ypdkrem3o1.execute-api.us-east-1.amazonaws.com/default/scrape_incoming_2';
  // let awsUrl = 'http://localhost:8000/scrape_incoming';
  //let awsUrl = 'http://keyword-lb-2127467146.us-east-1.elb.amazonaws.com:8001/scrape_incoming';

  //CURRENT:
  let awsUrl = 'https://morgfos7k4.execute-api.us-east-1.amazonaws.com/default/scrape_incoming';
  //let awsUrl = 'http://localhost:12340/scrape_incoming';
  console.log('url for scrape: ', awsUrl);
  try {
    const options = {
      method: 'POST',
      url: awsUrl,
      data: JSON.stringify({ data: html, url: url }),
      headers: { 'content-type': 'application/json' },
      timeout: 300000
    };

    return await axios(options);
  } catch (err) {
    console.log('error in metadata scraper', err);
    return err;
  }
  /*
  try {
    const html = await getPageHTML(url);
    const { publisher } = await metascraper({ html, url });
    const homepage = getHomepageUrl(url);
    return { publisher, homepage };
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return { publisher: '' };
  }
  */
};

/**
 * Get HTML of page for whose URL provided
 * @param  {string} url - url of page
 */
function getPageHTML(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url,
      timeout: 300000,
      headers: { 'content-type': 'text/html' }
    };
    request(options, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      return resolve(body);
    });
  });
}

function getHomepageUrl(url) {
  url = url.trim();
  let lopOffPoint = url.search(/\w(\/|\?|\#)\w*/gi);
  if (lopOffPoint > -1) {
    lopOffPoint += 1;
    let endStr = url.substring(lopOffPoint);
    return url.replace(endStr, '');
  } else {
    return url;
  }
}

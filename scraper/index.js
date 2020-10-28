//const diffbot = require('./diffbot');
const metascraper = require('./metascraper');
const comprehend = require('./comprehend');
const issue_id = require('./issue_identifier');

/**
 * Returns metadata using diffbot, metascraper and comprehend
 * @param  {string} url : url of page to scape
 */

module.exports = async function(html, url) {
  //const response = await Promise.all([diffbot(url), metascraper(url)]);
  //const metadata = Object.assign({}, ...response);
  try {
    let metadataResponse = await metascraper(html, url);
    let mLang, mBody;
    if (metadataResponse.data && metadataResponse.data.length > 3 && metadataResponse.data.body.length < 250) {
      return null;
      //  metadataResponse = await diffbot(url);
    } else {
      //metadataResponse = JSON.parse(metadataResponse.data.body); //occurs when scraper is local
      metadataResponse = metadataResponse.data;
      if (!metadataResponse) {
        console.log('metadata repsonse: ', metadataResponse);
      }
    }
    if (!metadataResponse.hasOwnProperty('body')) {
      return;
    }
    mLang = metadataResponse.language;
    mBody = metadataResponse.body;
    console.log('reutnred frome scraper, objectk eys: ', Object.keys(metadataResponse));
    let namedEntities;
    if (metadataResponse.hasOwnProperty('terms')) {
      namedEntities = metadataResponse.terms;
    } else {
      if (metadataResponse.hasOwnProperty('entities')) {
        namedEntities = metadataResponse.entities;
      } else {
        if (mBody.length > 10) {
          console.log('using aws comprehend explicitly');
          namedEntities = await comprehend(mLang, mBody);
        } else {
          namedEntities = [{}];
        }
      }
      metadataResponse.terms = namedEntities.map(elm => ({
        text: elm.Text,
        type: elm.Type
      }));
    }

    if (metadataResponse.hasOwnProperty('author')) {
      if (typeof metadataResponse.author == 'string') {
        metadataResponse.authors = metadataResponse.author.split(',');
      } else {
        metadataResponse.authors = metadataResponse.author;
      }
    }

    return metadataResponse;
  } catch (error) {
    console.log('ERROR in scraper/index.js : ', error);
    return null;
  }

  /*metascraper(html, url).then(function(metadata){
        metadata = metadata.data;
        
       comprehend(metadata.language, metadata.body).then(function(namedEntities){
            metadata.terms = namedEntities.map(elm => ({
                text: elm.Text,
                type: elm.Type
            }));

            return metadata;     
       });

    }).catch(function(err){
        console.log("meta err: ", err);
    });
    */
};

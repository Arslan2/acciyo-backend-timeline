/*
This module determines if the article page details an election issue and should therefore return multiple datasets or not
 */
const axios = require('axios');
module.exports = async function(body, kw) {
  /*
     params:
     - scraped_page is an object (provided by the scraper service)
    */

  /*
  eventually there will be a separate, standalohne service to determine what kind of dataset(s) the article requires.

 */
  const url = 'https://issue-identifier.herokuapp.com/is_issue';
  console.log('getting issue identified');
  try {
    const options = {
      method: 'POST',
      url: url,
      data: JSON.stringify({ article_body: body, keywords: kw }),
      headers: { 'content-type': 'application/json' },
      timeout: 300000
    };

    return await axios(options);
  } catch (err) {
    console.log('error in metadata scraper', err);
    return err;
  }

  return null;
};

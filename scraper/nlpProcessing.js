const axios = require('axios');
module.exports = async function(content) {
  const url = 'https://issue-identifier.herokuapp.com/lemmer';
  // const stemurl = 'https://issue-identifier.herokuapp.com/stem';
  try {
    const options = {
      method: 'POST',
      url: url,
      data: JSON.stringify({ body: content }),
      headers: { 'content-type': 'application/json' }
    };

    return await axios(options);
  } catch (err) {
    console.log('error getting stemmed body: ', err.toString());
    return err.statusCode;
  }
};

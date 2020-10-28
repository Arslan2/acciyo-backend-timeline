//const metascraper = require('metascraper')([require('metascraper-publisher')()]);
const axios = require('axios');
//const request = require('request');

/**
 * Get Publisher Name Using MetaScraper
 * @param  {string} url - url of page to scrape
 */

module.exports = async function(articleBody, articleId) {
  //    let awsUrl = 'https://0gh70eruzh.execute-api.us-east-1.amazonaws.com/default/keyword_extractor';

  let keywordExtractUrl = 'http://keyword-lb-2127467146.us-east-1.elb.amazonaws.com:8000/extract_keywords';
  let jobCompleteCheckUrl = 'http://keyword-lb-2127467146.us-east-1.elb.amazonaws.com:8000/get_test_task/';

  // let keywordExtractUrl = 'http://34.204.70.242:8000/extract_keywords';
  // let jobCompleteCheckUrl = 'http://34.204.70.242:8000/get_test_task/';
  try {
    // const data = {
    //data: JSON.stringify({ id:articleId, body: articleBody })
    // headers: 'Content-Type: application/json X-API-Key:'+process.env.GATEWAY_API_KEY
    // };
    const conf = {
      url: keywordExtractUrl,
      method: 'POST',
      timeout: 300000,
      data: JSON.stringify({ id: articleId, body: articleBody, save_to_db: true }),
      headers: { 'Content-Type': 'application/json' }
      //headers: {'X-API-Key':process.env.GATEWAY_API_KEY, 'Content-Type':'application/json'}
      //'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*'}
    };
    let task = await axios(conf);
    let taskid = task.data.id;

    const taskCheck = {
      url: jobCompleteCheckUrl + taskid,
      method: 'GET',
      timeout: 300000
    };

    async function checkComplete() {
      return sleep(2500).then(async function() {
        let taskResp = await axios(taskCheck);
        console.log(taskResp.data);
        if (taskResp.data.state !== 'PENDING') {
          console.log('not pending,');
          if (taskResp.data.data) {
            try {
              const jsonified = JSON.parse(taskResp.data.data);
              return jsonified;
            } catch (err) {
              console.log('could not jsonify and return data for keywordextractor, line 49: ', err);
            }
          } else {
            return { keywords: '' };
          }
        } else {
          console.log('going through function again');
          return await checkComplete();
        }
      });

      /**
          if(taskComplete==false){
                       }else{
              return "skipped return";
          }
  **/
    }
    return checkComplete();
    /*
      var inst = axios.create({
          baseURL: 'https://0gh70eruzh.execute-api.us-east-1.amazonaws.com/default',
          timeout:00,
          headers:{'Content-Type':'application/json',
                    'X-API_Key':process.env.GATEWAY_API_KEY}
      });
      */

    //return await axios(conf);
    //const headers = {'Content-Type':'application/json', 'X-Api-Key':process.env.GATEWAY_API_KEY};
    //return await axios.post(awsUrl, data,headers );
  } catch (err) {
    console.log('error in keyword extraction', err);
    return err;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

const AWS = require('aws-sdk');

const config = sails.config.custom;

AWS.config.update(config.aws);

const comprehend = new AWS.Comprehend(); // Initialize comprehend object

/**
 * Returns named entities from analyzing text data using comprehand
 * @param  {string} languageCode - language code of text
 * @param  {string} text - raw data from which entities
 */

module.exports = function(languageCode, text) {
  return getEntities(languageCode, getSafeText(text));
};

/**
 * Returns named entities from text
 * @param  {string} languageCode - language code of text
 * @param  {string} text - raw data from which entities
 */

async function getEntities(languageCode = 'en', text) {
  const params = {
    LanguageCode: languageCode,
    Text: text
  };
  const { Entities } = await comprehend.detectEntities(params).promise();
  return Entities.reduce((acc, entity) => {
    if (!acc.find(elm => elm.Text === entity.Text)) {
      acc.push(entity);
    }
    return acc;
  }, []);
}

/**
 * Truncates text of size upto size 5000 bytes which is safe limit for AWS
 * @param  {string} text - raw data which needs to be truncated.
 */

function getSafeText(text) {
  if (Buffer.from(text).length > 4900) {
    return Buffer.alloc(4900, text, 'utf8').toString();
  }
  return text;
}

var fs = require('fs');
var path = require('path');
var util = require('util');
module.exports = {
  friendlyName: 'Check if URL is news site',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {
    url: {
      description: 'url to check for',
      type: 'string',
      required: true,
      in: 'query'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'URL VALID'
    },
    failure: {
      responseType: 'ok',
      description: 'URL NOT VALID'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    let url = inputs.url;

    const genericUrl = extractDomain(url.trim());
    const domain = genericUrl.generic_url;
    if (isCovidLiveUpdatePage(url)) {
      let responseModel = {
        error: false,
        urlValid: true,
        existsInDb: false,
        isHomepage: false,
        domain: domain,
        timelineRequired: yes
      };
    }
    const filePath = path.join('data', 'converted_to_urls2.csv');
    const readF = util.promisify(fs.readFile);
    let responseModel = {
      error: false,
      urlValid: false,
      existsInDb: false,
      isHomepage: genericUrl.is_homepage,
      domain: domain,
      timelineRequired: timelineRequired(url)
    };
    async function checkValidity(data, err) {
      let valid = false;

      if (!err) {
        let urlArray = data.split(',');
        let splitDomain = domain.split('.');
        // if the resulting array holds more than 2, then we need to change the first item to '*' (to allow for subdomain patterns)
        if (splitDomain.length > 2) {
          splitDomain[0] = '*';
        }
        let rejoinedDomain = splitDomain.join('.');
        let i = 0;
        while (valid === false && i < urlArray.length) {
          let domainIntUrl = urlArray[i].toLowerCase().indexOf(rejoinedDomain.toLowerCase());
          i++;
          if (domainIntUrl > -1) {
            valid = true;
            break;
          }
        }
      } else {
        return { urlValid: null, error: true, errorMessage: err };
      }

      if (valid) {
        const isInDB = await Article.find({ url: url });

        if (isInDB.length > 0) {
          return { error: false, urlValid: true, existsInDb: true };
        } else {
          return { error: false, urlValid: true, existsInDb: false };
        }
      } else {
        return { error: false, urlValid: false, existsInDb: false };
      }
    }

    try {
      let res = await readF(filePath, 'utf-8').then(checkValidity);
      responseModel.existsInDb = res.existsInDb;
      responseModel.urlValid = res.urlValid;
      responseModel.error = res.errorMessage;
      if (res.error) {
        responseModel.errorMessage = res.errorMessage;
      }
      return exits.success(JSON.stringify(responseModel));
    } catch (err) {
      return exits.serverError(err);
    }
  }
};

function makeGenericUrl(originalUrl) {
  //sub http with *
  let noHttp = originalUrl.replace(/(http(s)?)/g, '*');
  let noWWW = noHttp.replace(/(www)/, '*');
  let noParamsIndex = noWWW.search(/\w\/[\w\s\_\d\-\?\=\+]+[\/\?\.]?/g);
  if (noParamsIndex < 0) {
    return { generic_url: noWWW, is_homepage: true };
  }
  let paramSubstring = noWWW.substring(noParamsIndex + 1);

  let url = noWWW.replace(paramSubstring, '/*');
  return { generic_url: url, is_homepage: false };
}

function fileProcess(data, domain) {
  var err = false;
  if (!err) {
    let valid = false;
    let urlArray = data.split(',');
    let i = 0;
    while (valid === false && i < urlArray.length) {
      let tUrl = urlArray[i];
      if (tUrl.indexOf(domain) > -1) {
        valid = true;
      }
      i++;
    }
    return valid;
    //return exits.failure(JSON.stringify({ error: false, urlValid: false }));
  } else {
    return false;
  }
}

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
function isForbidden(domain, urlFragment) {
  const robots = domain; //LEFT OFF HERE
}

function timelineRequired(url) {
  const regexForGettingMain = /http(s)?\:\/\/(www.)?\w*(\.\w{2,})+/g;
  let remainingUrlFragment = url.replace(regexForGettingMain, '').trim();
  console.log('remaining url fragment: ', remainingUrlFragment);
  const timelineNecessary = true;
  const timelineNotNecessary = false;
  if (remainingUrlFragment.length < 2) {
    return timelineNotNecessary;
  }

  const regexSectionNamesString = '(' + possibleSectionNames.join('|') + ')';
  const regexSectionsString = '(' + possibleSections.join('|') + ')';
  const joinedRegex = '(' + possibleSectionNames.join('|') + '|' + possibleSections.join('|') + ')';
  //let regexSection = new RegExp("/^(\\/|\\?)("+regexSectionsString+"\\/"+regexSectionNamesString+"|"+regexSectionNamesString+"|"+regexSectionNamesString+"\\=\\w*)(\\/((index|main|home)\\.\\w+\\/?)|\\/)?$/gi");
  let regexSection = new RegExp(
    '^(\\/|\\?)(' +
      joinedRegex +
      '\\/' +
      joinedRegex +
      '|' +
      joinedRegex +
      '|' +
      joinedRegex +
      '\\=\\w*)(\\/?(index|main|home)(\\.\\w+)?)?\\/?$',
    'gi'
  );
  let isSectionPage = remainingUrlFragment.search(regexSection) > -1 ? true : false;
  console.log('is section page? ', isSectionPage);
  if (isSectionPage) {
    return timelineNotNecessary;
  } else {
    return timelineNecessary;
  }
  return timelineNecessary;
}

function isCovidLiveUpdatePage(articleUrl) {
  var urls = [
    'https://www.inquirer.com/health/coronavirus/live/',
    'https://www.washingtonpost.com/world/2020/03/30/coronavirus-latest-news',
    'https://www.nytimes.com/2020/04/16/us/coronavirus-cases-live-updates.html',
    'https://edition.cnn.com/world/live-news/coronavirus-pandemic-04-20-20-intl/',
    'https://www.npr.org/sections/coronavirus-live-updates/'
  ];

  for (var index in urls) {
    let url = urls[index];
    let isLiveArticle = articleUrl.indexOf(url) > -1 ? true : false;
    if (isLiveArticle) {
      return true;
    }
  }
}

const possibleSections = [
  'section',
  'sections',
  'category',
  'categories',
  'sections',
  'topic',
  'topics',
  'trending',
  'trend',
  'trends',
  'top',
  'topnews',
  'today',
  'page',
  'tag',
  'news',
  'breaking',
  'breakingnews',
  'updates',
  'blog',
  'update'
];

const possibleSectionNames = [
  'business',
  'lifestyle',
  'entertainment',
  'national',
  'nation',
  'world',
  'U\\.S',
  'US',
  'politics',
  'elections',
  'economy',
  'money',
  'travel',
  'leisure',
  'food',
  'style',
  'fashion',
  'world',
  'international',
  'breaking',
  'breaking\\-news',
  'breakingnews',
  'top',
  'trending',
  'realestate',
  'arts',
  'art',
  'science',
  'scienceandtechnology',
  'scienceandtech',
  'technology',
  'tech',
  'health',
  'wellness',
  'local',
  'metro',
  'city',
  'events',
  'calendar',
  'society',
  'books',
  'movies',
  'weekend',
  'obituaries',
  'obit',
  'oped',
  'opinion',
  'editorial',
  'letterstotheeditor',
  'team',
  'about\\-us',
  'about',
  'members',
  'music',
  'staff',
  'directory',
  'crime',
  'reviews',
  'critics',
  'shopping',
  'video',
  'sports',
  'college',
  'education',
  'government',
  'culture',
  'transportation',
  'traffic',
  'weather',
  'notices',
  'reports',
  'analysis',
  'beat',
  'investigativereporting',
  'investigations',
  'investing',
  'investment',
  'investments',
  'finance',
  'commodities',
  'options',
  'futures',
  'stocks',
  'markets',
  'archives',
  'archive',
  'blog',
  'myaccount',
  'account',
  'profile',
  'directory',
  'billing',
  'payment',
  'user',
  'subscription',
  'subscriber',
  'dashboard'
];

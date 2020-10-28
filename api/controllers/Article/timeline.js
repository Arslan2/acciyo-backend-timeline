const metaData = require('../../../scraper/index');
const keywordExtractor = require('../../../scraper/keywordExtractor.js');
const nlp = require('../../../scraper/nlpProcessing.js');
const issue_identifer = require('../../../scraper/issue_identifier.js');
const { default: splitter } = require('full-name-splitter');
const uuid = require('uuid').v4;

module.exports = {
  friendlyName: 'Article timeline',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {
    url: {
      description: 'Current url to get timeline for.',
      type: 'string',
      required: true,
      in: 'body'
    },
    data: {
      description: 'HTML from article page',
      type: 'string',
      allowNull: true,
      in: 'body'
    },
    clientversion: {
      description: 'describes whether queues are expected in the front end - for backwards compatibility',
      type: 'string',
      allowNull: true,
      in: 'body'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response when articles are found for the current url.'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    try {
      let timelineInputs = { data: inputs.data, url: inputs.url };
      let timeline = await sails.helpers.getTimeline.with(timelineInputs);
      if (timeline) {
        return exits.success(timeline);
      }

      if (!inputs.hasOwnProperty('clientversion')) {
        if (inputs.clientversion !== 'queues') {
          let timelineRetreived = await sails.helpers.timelineCreation.with(timelineInputs);
          if (timelineRetreived) {
            return exits.success(timelineRetreived);
          } else {
            return exits.serverError(timelineRetreived);
          }
        }
      }

      //return exits.success("NOT EXISTING TIMELINE");
      let job = await testQueue.getJob(inputs.url);
      if (job) {
        console.log('job found, status: ', job.progress());
        if (job.progress() === 100) {
          return exits.success(null);
        } else {
          return exits.success({ jobid: job.id });
        }
      }

      job = await testQueue.add('createTimeline', timelineInputs, { jobId: inputs.url });
      return exits.success({ jobid: job.id });
    } catch (err) {
      console.log('ERROR IN timeline.js', err);
      return exits.serverError(err);
    }

    //   //check if the article exists in the db
    //   let pageData = inputs.data;
    //   let url = inputs.url;
    //   let urlSearchResults = await Article.find({
    //     where: {
    //       url,
    //       body: { '!=': '' },
    //       publishedAt: { '!=': null }
    //     },
    //     sort: 'updatedAt DESC'
    //   })
    //     .populate('authors')
    //     .populate('timeline')
    //       .populate('keywords');

    //   let originalArticle  = getBestArticleFromResults(urlSearchResults);

    //     let urlSearchResultPUBS = await getPublisherNames([originalArticle]);
    //     originalArticle = urlSearchResultPUBS[0];
    //     if (originalArticle.timeline.length>0) {

    //       console.log('url search result timeline: ');
    //         console.log(originalArticle.timeline);

    //         const timelineId = originalArticle.timeline[0].id;
    //       let timelineArticles = await getArticlesFromTimelineId(timelineId, url);

    //       let artIds = timelineArticles.map(art => art.id);
    //       console.log(`article ids count : ${artIds.length}`);
    //       let articles = await getArticlesFromIds(artIds, url);

    //     articles = await getPublisherNames(articles);

    //       articles = articles.map(formatForTimeline);
    //     return exits.success(
    //       JSON.stringify({
    //         articles: articles,
    //         terms: _cullTerms(originalArticle.terms),
    //           timeline: { id: timelineId, method: 'covid aggregated' },
    //         original_article: formatForTimeline( originalArticle)
    //       })
    //     );
    //   }
    //     //return exits.success("NOT EXISTING TIMELINE");
    //   let jobid = await testQueue.add(inputs);
    //   return exits.success({ jobid: jobid.id });
  }
};

function removeUnnecessaryTerms(terms) {
  var blacklist2020 = [
    'Donald Trump',
    'Donald J. Trump',
    'President Donald Trump',
    'President Trump',
    'United States of America',
    'U.S.A',
    'U.S',
    'America',
    'Canada',
    'Mexico',
    'England',
    'Britain',
    'Great Britain',
    'United Kingdom',
    'UK'
  ];
  var filteredTerms = [];
  for (var t in terms) {
    let term = terms[t];

    if (blacklist2020.indexOf(term.text) < 0) {
      filteredTerms.push(term);
    }
  }
  return filteredTerms;
}
async function getCovidTimeline(keywords) {
  let articles = await Article.searchMethods.covidKeywordSearch(keywords);
}
function articleHasEnoughDataToGenerateTimeline(articleDetails) {
  if (articleDetails.body.length > 10 && articleDetails.terms.length > 1) {
    return true;
  }
  return false;
}
function formatForTimeline(e) {
  if (e == undefined || e == null) {
    return {};
  }
  let culled_terms = [];
  if (e.terms !== undefined && e.terms.length > 1 && e.terms[0].length !== undefined && e.terms[0].length > 0) {
    culled_terms = _cullTerms(e.terms);
  }
  const apiRestrictedUrl = 'https://api.ap.org/media/v/content/';
  let eUrl = '';

  if (e.url !== undefined && e.url !== null) {
    eUrl = e.url.indexOf(apiRestrictedUrl) == 0 ? e.url.replace(apiRestrictedUrl, 'https://apnews.com/') : e.url;
  }

  let keyArr;
  let postProcessingDetails;
  if (e.hasOwnProperty('keywords')) {
    if (e.keywords.length > 1) {
      keyArr = e.keywords[0].keywords;
    } else {
      keyArr = [];
    }
    //keywords now arrive frm db in array format
    // keyArr = e.keywords[0].keywords.replace(/[\{\}]*/gi, '').split(',');

    postProcessingDetails = { keywords: keyArr, category: e.category };
  } else {
    keyArr = [];
  }
  let pubDate = e.publishedAt;
  if (e.publisher.id.trim() === 'c40c24e5-5d44-4b4a-ba28-e4e0b853711d') {
    let ogDate = new Date(e.publishedAt);
    let ogDateM = ogDate.getMonth();
    let ogDateD = ogDate.getDate();
    let ogDateY = ogDate.getFullYear();
    let ogDateH = ogDate.getHours();
    let ogDateMn = ogDate.getMinutes();
    //new Date(year, month, day, hours, minutes, seconds, milliseconds)
    pubDate = new Date(ogDateY, ogDateD - 1, ogDateM + 1, ogDateH, ogDateMn, 0, 0);
    console.log(`pub date new: ${pubDate}, old: ${e.publishedAt}`);
  }

  let returnMe = {
    id: e.id,
    title: e.title,
    url: eUrl,
    publishedAt: pubDate.toISOString(),
    text: e.body,
    terms: culled_terms,
    artDetails: postProcessingDetails,
    publisherName: ''
  };
  if (e.publisher !== undefined && e.publisher !== null) {
    if (e.publisher.hasOwnProperty('name')) {
      returnMe.publisherName = e.publisher.name;
    } else {
    }
  }
  return returnMe;
}

function getBestArticleFromResults(articlesFound) {
  //This is to help pick an article that matches the search if there are duplicates returned.
  if (!articlesFound) {
    return null;
  }

  if (articlesFound.length === 0) {
    return null;
  }
  if (articlesFound.length === 1) {
    return articlesFound[0];
  }
  let bestArticle = articlesFound[0],
    maxBodyLength = articlesFound[0].body.length,
    publishDate = articlesFound[0].publishedAt,
    hasKeywords = articlesFound[0].keywords ? true : false;

  for (var i = 1; i < articlesFound.length; i++) {
    let currentArticle = articlesFound[i];
    if (
      currentArticle.publishedAt !== 'null' &&
      currentArticle.publishedAt !== null &&
      currentArticle.publishedAt !== undefined &&
      currentArticle.publishedAt !== 'undefined'
    ) {
      let replaceBestArticle = true;
      let currentHasKeywords =
        !currentArticle.keywords || currentArticle.keywords.length < 1 || currentArticle.keywords === '{}'
          ? false
          : true;
      if (currentArticle.body.length < maxBodyLength) {
        replaceBestArticle = false;
      }
      if (!currentHasKeywords && hasKeywords === true) {
        replaceBestArticle = false;
      }
      if (replaceBestArticle) {
        let currentPubDate = new Date(currentArticle.publishedAt);
        if (publishDate !== '' && publishDate <= currentPubDate) {
          if (publishDate === currentPubDate) {
            if (bestArticle.createdAt >= currentArticle.createdAt) {
              replaceBestArticle = false;
            }
          }
          if (replaceBestArticle) {
            bestArticle = currentArticle;
            publishDate = currentPubDate;
            maxBodyLength = currentArticle.body.length;
            hasKeywords = currentHasKeywords;
          }
        }
      }
    } else {
      console.log('currentArticle.publishedAt not valid: ', currentArticle.id);
    }
  }
  return bestArticle;
}

async function getTimelineArticles(originalArticle) {
  let urlSearchResult = originalArticle;

  if (!originalArticle) {
    return null;
  }
  let terms_modified = urlSearchResult.terms || [];
  let title = urlSearchResult.title;
  let keywords = await getArticleKeywords(urlSearchResult);
  //let terms_modified = _cullTerms(terms, null);
  let articles;
  let searchMethod = 'keywords';

  if (keywords.length > 0) {
    let matchingKeywords = await Article.searchMethods.keywordSearch(keywords, terms_modified);

    let articleIds = [];
    if (matchingKeywords !== null || matchingKeywords !== undefined) {
      if (matchingKeywords.length == 0) {
        return null;
      }

      articleIds = matchingKeywords.map(res => {
        if (res.articleId !== originalArticle.id) {
          return res.articleId;
        }
      });
    } else {
      //if no keyword matches were found at all, we search via entities
      articleIds = await getArticlesViaEntities(terms_modified);
    }
    //get the articles data from the list of article ids produced by keywords / entities search
    let articlesNoPubs = await getArticlesFromIds(articleIds, urlSearchResult.url);
    articles = await getPublisherNames(articlesNoPubs);
    articles = await getCategory(articles);
  } else {
    searchMethod = 'terms';
    keywords = false;
    //articles = [];
    articles = await getArticlesViaEntities(terms_modified);
    if (articles) {
      articles = await getPublisherNames(articles);
      articles = await getCategory(articles);
    }
  }

  return [articles, searchMethod];
}
async function getArticlesFromIds(idlist, excludeUrl) {
  return await Article.find({
    where: { id: idlist, publishedAt: { '!=': null }, url: { '!=': excludeUrl } },
    sort: 'publishedAt DESC'
  }).populate('keywords');
}
async function getCategory(articles) {
  if (!articles) {
    return articles;
  }
  let articlesWithCategory = [];

  let articlesIds = articles.map(function(item) {
    return item.id;
  });

  let categories = {};
  for (let p = 0; p < articlesIds.length; p++) {
    let articlesId = articlesIds[p];
    categories[articlesId] = await Category.findOne({ articleId: articlesId });
  }

  for (let i = 0; i < articles.length; i++) {
    let item = articles[i];
    if (item.hasOwnProperty('category')) {
      item['category'] = categories[item].category;
    }
    articlesWithCategory.push(item);
  }
  return articlesWithCategory;
}
async function getPublisherNames(articles) {
  if (!articles) {
    return articles;
  }
  if (articles.length === 0) {
    return articles;
  }
  let articlesWithPublishers = [];

  let pubs = articles.map(function(item) {
    return item['publisher'];
  });
  let pubsUniques = [];
  for (let p = 0; p < pubs.length; p++) {
    let cid = pubs[p];
    if (pubsUniques.indexOf(cid) === -1) {
      pubsUniques.push(cid);
    }
  }
  let publishers = {};
  for (let p = 0; p < pubsUniques.length; p++) {
    let pubUid = pubsUniques[p];
    publishers[pubUid] = await Publisher.findOne({ where: { id: pubUid } });
  }
  for (let i = 0; i < articles.length; i++) {
    let item = articles[i];
    item['publisher'] = publishers[item['publisher']];
    articlesWithPublishers.push(item);
  }
  return articlesWithPublishers;
}
async function getArticlesViaEntities(terms_modified) {
  if (!terms_modified) {
    return null;
  }
  let articlesRaw = await Article.searchMethods.namedEntitiesSearch(terms_modified);
  let articles = [];
  let articlesids = articlesRaw.rows.map(art => {
    return art.id;
    //        return await Article.findOne({ id: art.id }).populate('keywords');
  });
  //articles = await Article.find({where: { id: articlesids }}).populate('keywords');
  return articlesids;
}
async function getArticleKeywords(originalArticle) {
  const createIfNone = true;
  let keywords = await getKeywords(originalArticle.id, originalArticle.body, createIfNone);
  return keywords;
}
function removeDuplicatesAndInvalid(articles, targetUrl) {
  if (articles.length < 1) {
    return [];
  }
  let uniqueNames = [];
  let uniques = articles.filter(elem => {
    if (uniqueNames.indexOf(elem.title) < 0 && elem.url !== targetUrl) {
      uniqueNames.push(elem.title);
      return elem;
    }
  });
  console.log('uniques articles being returned: ', uniques.length);
  return uniques;
}
async function getKeywords(articleId, articleBody, createKeywordsIfNoneFound) {
  if (articleBody.length < 140) {
    console.log('article body scraped is not long enough to warrant keywords');
    return [];
  }
  try {
    let keywordsRes = await Keywords.find({ where: { articleId: articleId }, sort: 'createdAt DESC' });
    let keywords = keywordsRes[0];
    if (!keywords) {
      if (articleBody.length > 140 && createKeywordsIfNoneFound === true) {
        try {
          let keywordResponse = await keywordExtractor(articleBody, articleId);
          if (keywordResponse.error === false || keywordResponse.error === 'false') {
            keywords = keywordResponse.data;
            const curDate = new Date().toISOString();
            let keywordRecord = await Keywords.findOne({ articleId: articleId });
            //,{articleId:articleId, keywords:keywords, createdAt: curDate, updatedAt: curDate, method:'Text Rank 1.0'});
            return keywords.keywords;
          }
        } catch (err) {
          console.log(`Error in getKeywords->keywordExtractor, timeline.js: ${err}`);
          return [];
        }
      } else {
        console.log('body is not long enough to warrant a keyword extraction');
        return [];
      }
    } else {
      if (keywords.length === 0 && createKeywordsIfNoneFound === true) {
        let keywordResponse = await keywordExtractor(articleBody, articleId);
        if (keywordResponse.error === false || keywordResponse.error === 'false') {
          keywords = keywordResponse.data;
          if (keywords.hasOwnProperty('keywords')) {
            keywords = keywords.keywords;
          }
          if (keywords.length == 0) {
            return [];
          }
          const curDate = new Date().toISOString();
          let keywordRecord = await Keywords.findOrCreate(
            { articleId: articleId },
            {
              articleId: articleId,
              keywords: keywords,
              createdAt: curDate,
              updatedAt: curDate,
              method: 'Text Rank 1.0'
            }
          );
          return keywords;
        }
      } else {
        return keywords.keywords;
      }
    }
  } catch (e) {
    console.log(`Error in getKeywords->find Keywords, timelins.js: ${e}`);
    return [];
  }
}
/**
Check if the url indicates a non-article page (so no timeline should get generated)
*/
/**
 * Create article from its metadata.
 * @param  {object} metadata - metadata got from scraper.
 */
async function _createArticle(metadata, url) {
  try {
    let author = metadata.authors !== undefined && metadata.authors.length > 0 ? true : false;
    let authorIds;
    if (author) {
      authorIds = await getAuthorIds(metadata);
    }
    let publisher;
    let cleanUrl = extractPublisherUrl(url);

    if (metadata.publisher) {
      publisher = await Publisher.findOrCreate({ url: cleanUrl }, { name: metadata.publisher, url: cleanUrl });
    }

    let article = await Article.create({
      id: uuid().trim(),
      ...(author ? { authors: authorIds } : {}),
      ...(publisher ? { publisher: publisher.id.trim() } : {}),
      categories: metadata.categories ? metadata.categories.toString() : null,
      title: metadata.title,
      terms: JSON.stringify(metadata.terms),
      url: url,
      publishedAt: metadata.publishedAt || null,
      language: metadata.language !== undefined && metadata.language.length > 1 ? metadata.language : 'en',
      body: metadata.body,
      source: 'webpage'
    }).meta({ fetch: true });
    //create the article-author link necessary
    if (authorIds) {
      await createArticleAuthorLinks(authorIds, article.id);
    }
    let keywords = await keywordExtractor(metadata.body, article.id);
    let kres = keywords['data']['keywords'];
    if (kres !== 'None' && kres !== '' && kres !== null) {
      if (kres.length > 0) {
        const curDate = new Date().toISOString();

        keywords = await Keywords.findOrCreate(
          { articleId: article.id },
          { articleId: article.id, keywords: kres, createdAt: curDate, updatedAt: curDate, method: 'Text Rank 1.0' }
        );
      }
    }
    let articleFound = await Article.findOne({ id: article.id })
      .populate('keywords')
      .populate('category')
      .populate('authors');

    return articleFound;
    //return { keywords: keywords, articleId: article.id };
  } catch (err) {
    console.log(`Error in _createArticle: ${err}`);
    return null;
    //return { keywords: null, articleId: null };
  }
}
function extractPublisherUrl(longUrl) {
  const reg = /(http(s)?\:\/\/(www\.)?\w*\.\w+)/i;
  let cleaned = longUrl.match(reg);
  return cleaned[0];
}

function _cullTerms(terms, acceptableTerms) {
  if (!acceptableTerms) {
    acceptableTerms = ['location', 'person', 'organization', 'other', 'event'];
  }
  return culling(terms, acceptableTerms);

  try {
    return culling(terms);
  } catch (err) {
    console.log(`error in culling terms: ${err}`);
  }
}

function culling(terms, acceptableTerms) {
  let finalSet = [];
  let uniqueTerms = [];
  let removedTermsCount = 0;

  if (terms.length <= 1) {
    if (terms[0].length === 0 || terms[0].length === undefined) {
      return null;
    }
  }
  for (let i = 0; i < terms.length; i++) {
    let term = terms[i];

    let tType = term.type.trim().toLowerCase();
    if (acceptableTerms.indexOf(tType) > -1 && uniqueTerms.indexOf(term.text) < 0) {
      //if(term.type == "LOCATION" || term.type == "PERSON" || term.type == "ORGANIZATION" || term.type == "OTHER" || term.type == "EVENT"){
      let push = false;

      if (term.type === 'PERSON') {
        let mnames = term.text.split(' ');
        if (mnames.length > 1) {
          push = true;
        }
      } else {
        if (term.type === 'LOCATION') {
          let mnames = term.text.split(' ');
          if (mnames.length > 1) {
            if (term.text.toLowerCase().indexOf('america') === -1) {
              push = true;
            }
          }
        }
      }
      if (push) {
        uniqueTerms.push(term.text);
        finalSet.push(term);
      }
    } else {
      removedTermsCount++;
    }
  }
  if (finalSet.length === 0) {
    return null;
  }
  return finalSet;
}

async function getAuthorIds(metadata) {
  let ids = [];

  if (metadata.authors.length > 0) {
    metadata.authors.forEach(async function(authorData) {
      let firstName, lastName;
      if (typeof metadata.authors[0] == 'string') {
        let authorDataProcessed = metadata.authors[0].split(' ');
        firstName = authorDataProcessed[0].trim();
        lastName = authorDataProcessed.pop().trim();
      } else {
        firstName = authorData.firstName.trim();
        lastName = authorData.lastName.trim();
      }
      if (lastName.length > 0) {
        let authId = await getAuthorId(firstName, lastName);
        ids.push(authId);
      }

      if (metadata.hasOwnProperty('author_urls')) {
        for (var aurl = 0; aurl < metadata.author_urls.length; aurl++) {
          await Author.findOrCreate({ url: metadata.author_urls[aurl] }, { url: metadata.author_urls[aurl] }).then(
            function(author) {
              ids.push(author.id);
            }
          );
        }
      }
    });
  }
  return ids;
}

async function getAuthorId(firstName, lastName) {
  try {
    let author = await Author.findOrCreate(
      { firstName: firstName, lastName: lastName },
      { firstName: firstName, lastName: lastName }
    );
    return author.id;
  } catch (err) {
    let author = await Author.find({ firstName: firstName, lastName: lastName });
    let create = false;
    if (author) {
      if (author.length > 0) {
        return author[0].id;
      } else {
        create = true;
      }
    } else {
      create = true;
    }
    if (create) {
      author = await Author.create({
        firstName: firstName,
        lastName: lastName,
        updatedAt: new Date().toISOString()
      }).fetch();
      return author.id;
    }
  }
}

async function createArticleAuthorLinks(authorIds, articleId) {
  for (var i = 0; i < authorIds.length; i++) {
    let authId = authorIds[i];
    await ArticleAuthor.findOrCreate({ author: authId, article: articleId }, { author: authId, article: articleId });
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function isAnElectionIssue(extractedKeywords, articleBody) {
  console.log('called to check issue in timeline.js');
  let res = await issue_identifer(articleBody, extractedKeywords);
  if (res.status == 200) {
    let d = res.data;
    return d;
  }

  return false;
}
function isAnElectionIssue_hard_coded(extractedKeywords) {
  //determinable by keywords extracteed

  const issues = [
    {
      issue: 'Healthcare',
      keywords: ['drug', 'cost', 'price', 'prescription', 'health', 'state', 'year', 'medication', 'insurance', 'plan']
    },
    {
      issue: 'Gun Control',
      keywords: ['gun', 'law', 'violence', 'state', 'people']
    },
    {
      issue: 'Education',
      keywords: ['school', 'student', 'education', 'state', 'college', 'year', 'teacher']
    },
    {
      issue: 'Taxes',
      keywords: ['tax', 'state', 'federal', 'year', 'income']
    },
    {
      issue: 'Economy',
      keywords: ['percent', 'economy', 'rate', 'market', 'year', 'growth', 'ap', 'stock', 'job', 'trump', 'federal']
    }
  ];
  let maxCount = 0;
  let winningIssue = '';
  let winningIssueKw = [];

  for (var issueIndex in issues) {
    var issue = issues[issueIndex];
    let iName = issue.issue;
    let iKeywords = issue.keywords;
    console.log(issue);
    let kwCount = 0;

    for (var kw in extractedKeywords) {
      if (iKeywords.indexOf(kw) > -1) {
        kwCount += 1;
      }
    }
    if (kwCount > maxCount) {
      maxCount = kwCount;
      winningIssue = iName;
      winningIssueKw = iKeywords;
    }
  }
  if (winningIssue) {
    return { issue: winningIssue, issue_keywords: winningIssueKw, match_count: maxCount };
  } else {
    return null;
  }
}

function isAboutACandidate(termsArray) {
  console.log('Checking if this is about a candidate, term count: ', termsArray.length);
  //current candidates ONLY - March 9th 2020
  const dem_candidates = [
    'joe biden',
    'senator bernie sanders',
    'bernie sanders',
    'senator sanders',
    'sen sanders',
    'sen bernie sanders'
  ];
  const rep_candidates = [
    'roque de la fuente',
    'donald trump',
    'bill weld',
    'president donald trump',
    'president trump'
  ];

  let count = 0;
  let candidates = { republicans: [], democrats: [] };
  for (var i in termsArray) {
    let termData = termsArray[i];
    let term = termData.text.trim().toLowerCase();
    console.log('term: ', term);
    let termType = termData.type;
    if (dem_candidates.indexOf(term.toLowerCase()) > -1) {
      count++;
      if (candidates.democrats.indexOf(termData.text) < 0) {
        candidates.democrats.push(termData.text);
      }
    }
    if (rep_candidates.indexOf(term.toLowerCase()) > -1) {
      count++;
      if (candidates.republicans.indexOf(termData.text) < 0) {
        candidates.republicans.push(termData.text);
      }
    }
  }
  console.log('candidate name matches: ', count);
  if (count > 0) {
    return candidates;
  } else {
    return false;
  }
}
async function getArticlesFromTimelineId(timelineId, originalArticleUrl) {
  let articleslinks = await TimelineArticles.find({ where: { timelineId: timelineId } });
  let articleIds = articleslinks.map(function(res) {
    return res.articleId;
  });
  let articles = await getArticlesFromIds(articleIds, originalArticleUrl);
  console.log(`articles found for timelineId ${timelineId}: ${articles.length}`);
  //    let articles = await Article.find({where:{id:articleIds, publishedAt:{"!=":null}}}).populate('keywords');
  return articles;
}

async function isCovidRelated(article) {
  //Keywords
  let taKeywords = article.keywords;
  let taTerms = article.terms;
  let taDetails = article;

  const maxMatchIndex = 3;

  function getMatches(targetKeywords) {
    let matched = 0;
    let softMatch = 0;
    for (var ck of covidKeywords) {
      let matchedI = targetKeywords.indexOf(ck);

      if (matchedKeywordIsATopCovidKeyword(matchedI, ck)) {
        matched++;
        continue;
      }

      if (matchedI > -1) {
        softMatch++;
      }
    }
    if (matched === 0) {
      matched = false;
    }
    if (softMatch === 0) {
      softMatch = false;
    }
    return { matched, softMatch };
  }

  function matchedKeywordIsATopCovidKeyword(indexOfMatchedWordInCKList, matchKeyword) {
    if (indexOfMatchedWordInCKList > -1 && covidKeywords.indexOf(matchKeyword) <= maxMatchIndex) {
      return true;
    } else {
      return false;
    }
    // console.log(`index of matched keyword is: ${indexOfMatchedWordInCKList}`);
  }

  let { matched, softMatch } = getMatches(taKeywords);

  if (!matched) {
    // console.log('did not soft match and did not match, checking headline and body now');
    //check headline:
    let headline = taDetails.title.toLowerCase().split(' ');
    let intersection = headline.filter(x => covidKeywords.includes(x));
    if (intersection.length < 1) {
      let lemmas = await nlp(taDetails.body);
      lemmas = lemmas.data;
      if (typeof lemmas === 'string') {
        lemmas = JSON.parse(lemmas).lemmas;
      } else {
        lemmas = lemmas.lemmas;
      }
      for (var ck of covidKeywords.slice(0, 4)) {
        if (lemmas.indexOf(ck) > -1) {
          console.log('match found in article body: ', ck);
          softMatch = true;
        }
      }
    } else {
      matched = true;
    }
  }
  console.log(`following initial check..matched? ${matched} soft: ${softMatch}`);
  return matched;
}
async function covidSearch_V1(article) {
  let taKeywords = article.keywords;
  let taDetails = article;
  //matchingTimeline is retrieved by getting timeline that fits the keywords (in a locoal FILE)
  let matchingTimeline = await Article.searchMethods.getBestMatchBasedOnTimelineComponentsKeywords(taKeywords);

  if (!matchingTimeline.timelineId) {
    console.log('no good matching COVID timeline');
    return null;
  }
  // const timelineDetails = await Timelines.find({ where: { id: matchingTimeline.timelineId } });
  let customTimelineArticles = await getArticlesFromTimelineId(matchingTimeline.timelineId, taDetails.url);
  let customTimelineArticlesIds = customTimelineArticles.map(art => art.id);

  // console.log(`keyword search result for covid article with required keywords: ${customTimelineArticles.length}`);
  const requiredKeywords = ['covid19', 'covid-19', 'coronavirus'].concat(taKeywords);

  // let keywordsCOVID = new Set(Array.from(matchingTimeline.timelineKeywords).concat(requiredKeywords));
  let keywordsCOVID = matchingTimeline.timelineKeywords.filter(kword => {
    return requiredKeywords.indexOf(kword) == -1;
  });

  let massKeywordSearchIds = await Article.searchMethods.keywordIndividuallySearched(keywordsCOVID, requiredKeywords);
  let filteredKeywordMatches = massKeywordSearchIds.filter(karticleId => {
    return customTimelineArticlesIds.indexOf(karticleId) == -1;
  });

  const resultMax = Math.min(40 - customTimelineArticlesIds.length, filteredKeywordMatches.length);
  let articleIds_culled = filteredKeywordMatches.splice(0, resultMax);

  let massArticles = await getArticlesFromIds(articleIds_culled, taDetails.url);
  massArticles = massArticles.concat(customTimelineArticles);

  // console.log(`keyword search result for covid article with required keywords: ${massArticles.length}`);

  console.log('returning count for covid: ', massArticles.length);
  return massArticles;
}

async function saveTimeline(hostArticle, methodUsedToGenerateTimeline, descriptionOfTimeline, generatedTimeline) {
  const createDate = new Date().toISOString();

  const timeline = {
    id: uuid().trim(),
    description: descriptionOfTimeline,
    method: methodUsedToGenerateTimeline,
    createdAt: createDate,
    updatedAt: createDate,
    creatorId: hostArticle.id
  };
  const timelineFind = {
    creatorId: hostArticle.id,
    method: methodUsedToGenerateTimeline
  };
  try {
    //SAVE TIMELINE
    let timelineInDb = await Timelines.findOrCreate(timelineFind, timeline);
    // console.log("saved Timeline to db, id: ", timelineInDb.id);

    //SAVING RELATIONSHIP BETWEEN TIMELEIN AND THE ARTICLES IN IT - ASYCN and DO NOT WAIT FOR THIS
    const timelineArticles = generatedTimeline.map(async article => {
      if (article.id == hostArticle.id) {
        return;
      }
      let ta = {
        id: uuid().trim(),
        timelineId: timelineInDb.id,
        articleId: article.id,
        createdAt: createDate
      };
      let taFind = {
        timelineId: timelineInDb.id,
        articleId: article.id
      };

      var savedId = await TimelineArticles.findOrCreate(taFind, ta);
      return savedId.id;
    });
    return timelineInDb.id;
  } catch (err) {
    console.log(`Error in saving timeline for article: ${hostArticle.id}`);
  }

  //TO-COME : creating and saving TimelineKeywords
}

async function saveTermsTimeline(article, timelineSet) {
  let method = 'terms-search v1'; // v1 as of apr 2020
  let description =
    'Timeline generated through the search for terms that match within the article to the host article (creatorId)';
  let savedTimelineId = await saveTimeline(article, method, description, timelineSet);
  return savedTimelineId;
}

async function saveKeywordTimeline(article, timelineSet) {
  let method = 'keyword-search v1'; // v1 as of apr 2020
  let description =
    "Timeline generated through the search for a keyword set with important keywords at the 'front' of the list";
  let savedTimelineId = await saveTimeline(article, method, description, timelineSet);
  return savedTimelineId;
}

async function saveCovidTimeline(article, timelineSet) {
  const method = 'covidSearch_v1';
  const description =
    'COVID-19 Timeline generated because keywords, article title, or article body contained a reference to the COVID-19 key, identifying terminology. Seed timeline used: ';

  let savedTimelineId = await saveTimeline(article, method, description, timelineSet);
  return savedTimelineId;
}

async function saveEntityTimeline(article, timelineSet) {
  const method = 'entities-search v1';
  const description =
    'Timeline created through last resort match of the terms (entities) in the articles (and not just using the terms to perform a keyword search) ';

  let savedTimelineId = await saveTimeline(article, method, description, timelineSet);
  return savedTimelineId;
}

async function getAllCustomCovidTimelines(hostArticle) {
  let customCovidTimelineIds = [
    'ee5921a9-fd0d-4054-968f-e43812d11773',
    'ba7cd311-24c0-4b31-9f4f-4c75cc373f6d',
    'c3e7e5eb-43dc-4012-b31e-84616af61edc',
    '7b279772-ab25-4537-b3e6-92b594f3da53',
    '937d1b6b-bdd2-4505-aa4d-11d5e4671309',
    '5495b16a-aa5d-4da0-b5df-57df8b9f8cef',
    '95117559-4eff-4ff3-9548-38d92f8600bb'
  ];
  // let timelineArticles = customCovidTimelineIds.map(async function(item){
  //     let articles =  await getArticlesFromTimelineId(item, hostArticle.url);
  //     return articles;

  // });
  //Not using reduce because it requires a lot of scaffolding
  // let timeline = timelineArticles.reduce((acc,cur)=>{

  //     return acc.concat(cur);
  // });
  let timeline = [];
  for (var i in customCovidTimelineIds) {
    let tid = customCovidTimelineIds[i];
    let articles = await getArticlesFromTimelineId(tid, hostArticle.url);
    timeline.push(articles);
  }

  return timeline;
}

function isCovidLiveUpdatePage(hostArticle) {
  var urls = [
    'https://www.inquirer.com/health/coronavirus/live/',
    'https://www.washingtonpost.com/world/2020/03/30/coronavirus-latest-news',
    'coronavirus-cases-live-updates.html',
    'https://edition.cnn.com/world/live-news/coronavirus-pandemic-04-20-20-intl/',
    'https://www.npr.org/sections/coronavirus-live-updates/'
  ];

  let url = hostArticle.url;
  for (var index in urls) {
    let curl = urls[index];
    let isLiveArticle = url.indexOf(curl) > -1 ? true : false;
    if (isLiveArticle) {
      return true;
    }
  }
  return false;
}
//INCOMPLETE:
async function publisherDrivenTimelineSelection(publisherName, hostArticle) {
  var publisherNameLocations = {};
  var termsSelected = hostArticle.terms.map(termData => {
    return termData.type === 'LOCATION' ? termData.text : null;
  });
}

async function checkIfArticleIsAssociatedWithTimeline(articleDetails) {
  //returns all timelines ids with which it has a relationship
  let timelinesRaw = await TimelineArticles.getDatastore().sendNativeQuery(
    `select $1 from timeline_articles where $2=${articleDetails.id} group by ($1)`,
    ['timelineId', 'articleId']
  );

  let timelines = timelinesRaw.rows;
  if (timelinesRaw.rowCount > 0) {
    return timelines;
  } else {
    return false;
  }
}

function getMostRelevantTimelineInSet(articleKeywords, timelineCandidateIds) {}

const covidKeywords = [
  'coronavirus',
  'covid',
  'covid-19',
  'covid19',
  'virus',
  'china virus',
  'wuhan virus',
  'china',
  'wuhan',
  'pandemic',
  'epidemic',
  'outbreak',
  'sick',
  'social distancing',
  'lockdown',
  'shelter-in-place',
  'ppe',
  'icu',
  'mask',
  'testing',
  'test kit',
  'swab',
  'ventilator',
  'n95'
];

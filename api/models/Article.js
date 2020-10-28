/**
 * articles.js
 *
 * @description :: articles model to store the meta data associated from an articles.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
const sanitizeUrl = require('@braintree/sanitize-url').sanitizeUrl;
const axios = require('axios');
const uuid = require('uuid').v1;
const fs = require('fs');
module.exports = {
  attributes: {
    id: {
      type: 'string',
      required: true
    },
    authors: {
      collection: 'author',
      via: 'article',
      through: 'articleAuthor'
    },
    keywords: {
      collection: 'keywords',
      via: 'articleId'
    },
    timeline: {
      collection: 'timelines',
      via: 'creatorId'
    },
    category: {
      collection: 'category',
      via: 'articleId'
    },
    body: {
      type: 'string'
    },
    categories: {
      type: 'ref'
      //      columnType: 'jsonb'
    },
    language: {
      type: 'string'
    },
    title: {
      type: 'string'
    },
    source: {
      type: 'string',
      isIn: ['article', 'webpage'],
      required: true
    },
    publisher: {
      columnName: 'publisherId',
      model: 'publisher'
    },
    terms: {
      type: 'ref',
      columnType: 'jsonb'
    },
    url: {
      type: 'string',
      required: true,
      unique: true
    },
    publishedAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    updatedAt: {
      type: 'ref',
      columnType: 'datetime'
    },
    document: {
      type: 'ref',
      columnType: 'tsvector'
    }
  },
  tableName: 'articles',
  searchMethods: {
    namedEntitiesSearch,
    fullTextSearch,
    keywordSearch,
    election_issue_search,
    covidKeywordSearch,
    keywordIndividuallySearched,
    getBestMatchBasedOnTimelineComponentsKeywords
  },
  managementMethods: {
    deleteArticle
  },
  processing: {
    keywordSearchArticlesTrimmer
  },
  /**
   * hook that will be executed before create
   * @param  {Object} valuesToSet - model object
   * @param  {Function} proceed - callback
   */
  beforeCreate: function(valuesToSet, proceed) {
    //valuesToSet.id = uuid().trim();
    return proceed();
  },
  afterCreate: function(newRecord, proceed) {
    const articleId = newRecord.id;
    ArticleAuthor.modifyMethods.setId({ article: articleId });
    return proceed();
  }
};

/** 

 * Returns result based on named entities
 * @param  {JSON} terms - terms are significant named entities from articles that have Wikipedia pages
 */
async function keywordSearch(terms, culledEntities) {
  //culledEntities are the _cullTerms result from timeline.js
  //culledEntities is an array of filtered named entities.

  if (terms) {
    if (terms.length > 0) {
      let keywords = terms;

      let result = [];
      let maxMatch = 5;
      let queries = createQueryArray(keywords, maxMatch);
      let keywordsSortedByEntities = keywords;
      if (culledEntities) {
        keywordsSortedByEntities = resortKeywordEntities(keywords, culledEntities, maxMatch);
      }
      let sortedKeywordsQueries = createQueryArray(keywordsSortedByEntities, maxMatch);

      return Promise.all(queries)
        .then(async results => {
          return await getBestResultsFromKeywordSearch(results, 'arrayEqual');
        })
        .then(async res => {
          let result = res.bestResult;
          let queryResults = res.queryResults;

          let bestKeywords = res.keywordSearch;
          let bestresult = [];

          if (result.length <= 2) {
            let compResults = await getBestResultsFromKeywordSearch(queryResults, 'arrayComp');

            bestresult = compResults.bestResult;
            if (bestresult.length <= result.length) {
              return Promise.all(sortedKeywordsQueries).then(async res => {
                let secondToLastResort = await getBestResultsFromKeywordSearch(res, 'arrayComp');
                if (secondToLastResort.length >= 3) {
                  return secondToLastResort.bestResult;
                } else {
                  let lastResort = await getBestResultsFromKeywordSearch(res, 'all');

                  return lastResort.bestResult;
                }
              });
            } else {
              return bestresult;
            }
          } else {
            //result count is greater than 2.
            return result;
          }
        })
        .catch(err => {
          console.log('error in getting articles via keyword search');
          console.log(err);
        });
    }
  }
}

async function getBestResultsFromKeywordSearch(results, arrayFilter) {
  //'results' is the array of results from the keyword searches (each search result is an array of articles, each item in the 'results' array is a full search result)
  let bestresult = [];
  var bestKeywords;
  for (let resarray of results) {
    let result = [];
    const [result_, keywords] = resarray;
    const kwlen = keywords.length;
    for (let res of result_) {
      if (res === undefined || (res.keywords === undefined && res.keywords.length > 0)) continue;
      let eq;
      if (arrayFilter === 'arrayEqual') {
        eq = await sails.helpers.arrayEqual.with({
          array1: keywords,
          array2: res.keywords.slice(0, kwlen)
        });
        if (eq) result.push(res);
      }
      if (arrayFilter === 'arrayComp') {
        eq = await sails.helpers.arrayComp.with({
          targetKeywords: keywords,
          articleKeywords: res.keywords,
          sectionSize: kwlen + 1
        });
        if (eq) result.push(res);
      }
      if (arrayFilter === 'all') {
        result.push(res);
      }

      if (result.length > bestresult.length) {
        console.log(`best: ${result.length}`);
        bestresult = result;
        bestKeywords = keywords;
      }
    }
  }
  return { bestResult: bestresult, queryResults: results, keywordSearch: bestKeywords };
}

function keywordSearchArticlesTrimmer(timelineArticles, targetArticleDetails) {
  // This function groups the results to return to the front end so that the rendered timeline is less burdened (<30 results)
  let articles = [];
  let dateDiffs = [];
  for (let article of timelineArticles) {
    articles.push(new Date(article.publishedAt));
  }
  let diff = articles[0] - articles[articles.length - 1];
  const dayInSeconds = 60 * 1000 * 60 * 24;
  let mode = 0;

  // let firstArticleDate = new Date(articles[0]['publishedAt']);
  // let lastArticleDate = new Date(articles[-1]['publishedAt']);
  // console.log('article date diff : ', lastArticleDate - firstArticleDate);
  // console.log('type of timelineArticles: ', typeof(timelineArticles));
  // console.log('timelineArticles', timelineArticles);
  if (timelineArticles.length < 30) {
    return timelineArticles;
  }
  // OPTIONS:
  // 1. select the most 'representative' article per time period
  // 2. group by singular keywords (or perhaps this is easier on d3 side)
  // 3. group by term set of target article

  // const timespan =
}

function createQueryArray(keywords, maxMatch) {
  let queries = [];
  for (let i = 0; i < maxMatch; i++) {
    queries.push(
      new Promise(resolve => {
        return queryForMatchingKeywords(maxMatch - i, keywords, keywordQueryBuilder2).then(result => {
          resolve([result, keywords.slice(0, maxMatch - i + 1)]);
        });
      })
    );
  }
  return queries;
}
function lastResortKeywordQuery(keywords, minMatchCount) {
  let mustMatchKeywords = keywords;
  //.slice(0, minMatchCount + 1);
  mustMatchKeywords = mustMatchKeywords.map((kw, kwi) => {
    return "'" + kw.replace(/\-\.\+\&\s\,\!/g, '\\') + "'";
  });

  //let keywordMatchString = `string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),',')`;
  let mustMatchString = mustMatchKeywords.join(',');

  let query = ` array[${mustMatchString}]::varchar[] @> keywords[0:${minMatchCount + 2}]`;
  //  let query = `(string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),','))[0:${minMatchCount +
  // 2}] @> array[${mustMatchString}]`;
  console.log('LAST RESORT QUERY : ', query);
  return query;
}
async function queryKeywordCombinedWithCategory(matchCount, keywords, articleId) {
  //LEFT OFF HERE
}
async function queryForMatchingKeywords(matchCount, keywords, queryBuilder) {
  const startTime = Date.now();
  let queryWhere = queryBuilder(keywords, matchCount);

  if (queryWhere === null) {
    throw new Error('Query failed to build to find keyword matches of matchCount: ' + matchCount.toString());
    return;
  }
  let query = `select * from keywords where ${queryWhere}  limit(200)`;

  let tmp = await Keywords.getDatastore().sendNativeQuery(query, []);
  console.log('QUERY : ', query);
  let numrows = 0;
  if (tmp.rows !== undefined) numrows = tmp.rows.length;
  console.log('queryForMatchingKeywords time: ' + parseInt(Date.now() - startTime) + ' ms, rows: ' + numrows);
  let result = tmp.rows;
  return result;
}

function keywordMixQueryBuilder(keywords, minMatchCount) {
  //Produces matching records that have overlapping keywords (in any order/position)
  if (keywords) {
    let keywordsStructured = keywords
      .filter((kw, kwi) => {
        if (kwi <= minMatchCount) {
          return '(' + kw.replace('.', '\\.') + ')';
        }
      })
      .join('|');
    //const minMatchCount = keywords.length;
    let query = `keywords similar to '\\{([\\w*\\,\\s]*(${keywordsStructured})[\\w*\\,\\s]*){${minMatchCount}}\\}'`;
    console.log('QUERY : ', query);
    //     let tmp = await Keywords.getDatastore().sendNativeQuery(query, []);
    return query;
  }
  return null;
}

function resortKeywordEntities(keywords, entities, matchCount) {
  //this function changes the position of thek eywords so that named entities don't overtake the search and produce so few matches
  const priorityCount = matchCount - 1;
  //resorts keywords so that any named entities are de-prioritized to position 3 and
  let entitiesRegexCompiled = entities.map(e => {
    const splut = e.text.toLowerCase().split(' ');
    let splutForRegex = splut.map(sWord => {
      let cleaned = sWord.replace(/\./g, '\\.');
      cleaned = cleaned.replace(/\,/g, '\\,');
      cleaned = cleaned.replace(/\-/g, '\\-');
      return '(' + cleaned + ')';
    });
    let eGex = '([\\w\\s]*[' + splutForRegex.join('') + '][\\w\\s]*)';
    return eGex;
  });
  let entitiesWordGex = entitiesRegexCompiled.join('|');
  let entitiesRegex = new RegExp(entitiesWordGex, 'g');
  let wordPosInKeywords = keywords.map(k => {
    let matchResult = k.match(entitiesRegex);
    if (matchResult) {
      if (matchResult.length > 0) {
        return true;
      }
    }
    return false;
  });
  let sideA = [],
    sideB = [];
  wordPosInKeywords.forEach((keywordIsInEntityList, ind) => {
    if (keywordIsInEntityList) {
      sideB.push(keywords[ind]);
    } else {
      if (sideA.length >= priorityCount) {
        sideB.push(keywords[ind]);
      } else {
        sideA.push(keywords[ind]);
      }
    }
  });
  let rejiggered = sideA.concat(sideB);

  //console.log("rejiggered: ", rejiggered);
  return rejiggered;
}
function keywordQueryBuilder(keywords, minMatchCount) {
  let mustMatchKeywords = keywords.slice(0, minMatchCount + 1);
  mustMatchKeywords = mustMatchKeywords.map((kw, kwi) => {
    return "'" + kw.replace(/\-\.\+\&\s\,\!/g, '\\') + "'";
  });

  //let keywordMatchString = `string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),',')`;
  let mustMatchString = mustMatchKeywords.join(',');

  let query = `keywords[0:${minMatchCount + 2}] @> array[${mustMatchString}]::varchar[]`;
  //  let query = `(string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),','))[0:${minMatchCount +
  // 2}] @> array[${mustMatchString}]`;
  //console.log('QUERY : ', query);
  return query;
}

function keywordQueryBuilder2(keywords, minMatchCount) {
  let mustMatchKeywords = keywords.slice(0, minMatchCount + 1);
  mustMatchKeywords = mustMatchKeywords.map((kw, kwi) => {
    return "'" + kw.replace(/\-\.\+\&\s\,\!/g, '\\') + "'";
  });

  //let keywordMatchString = `string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),',')`;
  let mustMatchString = mustMatchKeywords.join(',');

  let query = `keywords @> array[${mustMatchString}]::varchar[]`;
  //  let query = `(string_to_array(REGEXP_REPLACE(REGEXP_REPLACE(keywords,'}',''),'{',''),','))[0:${minMatchCount +
  // 2}] @> array[${mustMatchString}]`;
  //console.log('QUERY : ', query);
  return query;
}

async function namedEntitiesSearch(terms) {
  terms = capTermCount(addEscapeCharToTerms(terms));
  let { whereQuery, caseQuery } = createSubQueryForTermsSearch(terms);
  caseQuery = caseQuery ? `, ${caseQuery}` : caseQuery;
  whereQuery = whereQuery ? `and ${whereQuery}` : whereQuery;
  let query = `select art.id ${caseQuery} from articles art inner join keywords keys on keys."articleId"=art.id where "publishedAt" IS NOT NULL ${whereQuery} ORDER BY "publishedAt" DESC LIMIT 200`;
  let result = await Article.getDatastore().sendNativeQuery(query, []);
  return result;
}
/**
 * Returns result based on full text search
 * @param  {JSON} terms - terms are significant named entities from articles that have Wikipedia pages
 */
async function fullTextSearch(terms) {
  terms = addEscapeCharToTerms(terms);
  //terms = experimentalTermSearch(addEscapeCharToTerms(terms));
  let namedEntities = createSubQueryForFullTextSearch(terms);
  let query = `SELECT id , SUBSTRING (body, 1, 100) || '...' as text , title ,url , "publisherId", terms, "publishedAt"  FROM articles WHERE "publishedAt" IS NOT NULL and document @@ to_tsquery('${namedEntities}') ORDER BY "publishedAt" DESC LIMIT 150`;
  // let query = `SELECT id , SUBSTRING (body, 1, 100) || '...' as text , title ,url , "publisherId", terms, "publishedAt", ts_rank_cd(document,query) AS rank FROM articles, to_tsquery('${terms}') AS query WHERE "publishedAt" IS NOT NULL and document @@ query ORDER BY(rank, "publishedAt") DESC LIMIT 150`;
  //console.log('query: ', query);
  let result = await Article.getDatastore().sendNativeQuery(query, []);
  return result.rows;
}

/**
 * Returns subquery for implementing full text search
 * @param  {JSON} terms - terms are significant named entities from articles that have Wikipedia pages
 */
function createSubQueryForFullTextSearch(terms) {
  let fulTextSubQuery = terms.reduce((acc, curr, i) => {
    if (i == 0) acc = curr['text'].split(' ').join('<->');
    else acc += '|' + curr['text'].split(' ').join('<->');
    return acc;
  }, ' ');
  fulTextSubQuery = fulTextSubQuery.replace(/:/g, '');
  return fulTextSubQuery;
}
/**
 * Returns subquery for search on named entities
 * @param  {JSON} terms - terms are significant named entities from articles that have Wikipedia pages
 */
function experimentalTermSearch(terms) {
  //get terms that are in the title
  let filteredTerms = terms.map(function(item) {
    return item['text'];
  });
  return filteredTerms.join(' & ');
  //then get location and person terms.
}
function capTermCount(terms) {
  if (terms.length > 10) {
    var locs = [],
      orgs = [],
      pers = [],
      other = [];
    for (var t = 0; t < terms.length; t++) {
      switch (terms[t].type) {
        case 'LOCATION':
          locs.push(terms[t]);
          break;
        case 'ORGANIZATION':
          orgs.push(terms[t]);
          break;
        case 'PERSON':
          pers.push(terms[t]);
          break;
        case 'OTHER':
          other.push(terms[t]);
          break;
      }
    }
    const maxT = 3;
    let final = other
      .splice(0, other.length > maxT ? maxT : other.length)
      .concat(pers.splice(0, pers.length > maxT ? maxT : pers.length))
      .concat(orgs.splice(0, orgs.length > maxT ? maxT : orgs.length))
      .concat(locs.splice(0));
    return final;
  } else {
    return terms;
  }
}
function createSubQueryForTermsSearch(terms) {
  let caseStart = ` CASE when terms  @>  `;
  let caseEnd = ` then 1 else 0 end `;
  let termsLength = terms.length;
  let caseQuery = terms.reduce((acc, curr, i) => {
    let caseMiddle = [
      {
        text: curr['text']
      },
      {
        type: curr['type']
      }
    ];
    if (i == termsLength - 1) acc += `${caseStart}  '${JSON.stringify(caseMiddle)}' ${caseEnd}`;
    else acc += `${caseStart}  '${JSON.stringify(caseMiddle)}' ${caseEnd} + `;
    return acc;
  }, '');
  caseQuery = caseQuery.length ? '( ' + caseQuery + `) /(${termsLength}.0) as score` : '';
  let whereStart = `terms @> `;
  let whereEnd = ` OR `;
  let whereQuery = terms.reduce((acc, curr, index) => {
    let whereMiddle = [
      {
        text: curr['text']
      },
      {
        type: curr['type']
      }
    ];
    if (termsLength == index + 1) acc += `${whereStart}  '${JSON.stringify(whereMiddle)}' `;
    else acc += `${whereStart}  '${JSON.stringify(whereMiddle)}'  ${whereEnd}`;
    return acc;
  }, '');
  whereQuery = whereQuery.length ? '( ' + whereQuery + ' )' : '';
  return {
    whereQuery,
    caseQuery
  };
}

function addEscapeCharToTerms(terms) {
  return terms.reduce((acc, term) => {
    let acceptableTerms = ['location', 'person', 'organization', 'other', 'event'];
    if (acceptableTerms.indexOf(term.type.trim().toLowerCase()) > -1) {
      //if (term.type !== 'QUANTITY' || term.type !== 'DATE') {
      acc.push({
        type: _addEscapeChar(term.type),
        text: _addEscapeChar(term.text)
      });
    }
    return acc;
  }, []);
}

function _addEscapeChar(str) {
  return (str + '').replace("'", "''");
}

async function deleteArticle(searchParams) {
  //only performs search and destroy if searchParams contains either id or url (or both)
  var query = {};

  if (searchParams.hasOwnProperty('ids')) {
    let vids = searchParams.ids.map(id => verifyIsId(id));
    if (vids) {
      query.id = vids;
    }
  } else {
    if (searchParams.hasOwnProperty('urls')) {
      let cleanUrls = searchParams.urls.map(surl => sanitizeUrl(surl));
      query.url = cleanUrls;
    }
  }
  /**
    var offendingArticles = await Article.find({where:query})
        .populate('keywords')
        .populate('authors')
        .populate('category');
    console.log(offendingArticles[1].authors);
   **/
  if (Object.keys(query).length > 0) {
    var offendingArticles = await Article.find({ where: query })
      .populate('keywords')
      .populate('authors')
      .populate('category');
    //remove keywords, articles_authors
    if (offendingArticles.length == 0) {
      return 'None to Delete';
    }

    var articleRemoved = [];
    for (var a = 0; a < offendingArticles.length; a++) {
      var articleFound = offendingArticles[a];
      var articleId = articleFound.id;
      let keywordIds = articleFound.keywords.map(k => k.id);
      let aaIds = articleFound.authors.map(a => a.id);
      let catIds = articleFound.category.map(c => c.id);
      if (keywordIds.length > 0) {
        let kde = await Keywords.destroy({ where: { id: keywordIds } });
      }
      if (aaIds.length > 0) {
        let kde = await ArticleAuthor.destroy({ where: { id: aaIds } });
      }
      if (catIds.length > 0) {
        let cde = await Category.destroy({ where: { id: catIds } });
      }
      let removed = await Article.destroyOne({ id: articleId });
      articleRemoved.push(removed.id);
    }
    return articleRemoved;
  }
  return 'Article Not Found';
}

function verifyIsId(idCandidate) {
  var t = idCandidate.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  if (t) {
    return idCandidate;
  } else {
    return false;
  }
}

function election_candidate_filter(issue_search_results, candidates) {
  //only returns the articles that also mention the candidates passed.
  var articlesWithCandidates = [];
  for (var i in issue_search_results) {
    var article = issue_search_results[i];

    var articleTerms = article.terms;
    for (var ati in articleTerms) {
      let artTerm = articleTerms[ati].text.toLowerCase().trim();
      if (candidates.republicans.indexOf(artTerm) > -1) {
        article.category = 'republicans';
      }
      if (candidates.democrats.indexOf(artTerm) > -1) {
        article.category = 'democrats';
      }
      if (article.hasOwnProperty('category')) {
        articlesWithCandidates.push(article);
      }
    }
  }
  if (articlesWithCandidates.length == 0) {
    return issue_search_results;
  }
  return articlesWithCandidates;
}
async function election_issue_search(issues, candidates) {
  var issue = getTopIssue(issues);
  if (issue.name === 'Climate Change') {
    let a = await getClimateChange();
    a = a.data;
    let cArticles = a.map(function(val) {
      return { title: val.title, text: val.body, url: val.url, publishedAt: val.publishedAt, terms: val.term_text };
    });
    return { articles: cArticles, issue: issue };
  }

  var queries = createQueryArray(issue.keywords, 5);

  return Promise.all(queries)
    .then(async results => {
      return await getBestResultsFromKeywordSearch(results, 'arrayEqual');
    })
    .then(async res => {
      let result = res.bestResult;
      let queryResults = res.queryResults;
      let bestresult = [];
      let compResults = await getBestResultsFromKeywordSearch(queryResults, 'arrayComp');
      bestresult = compResults.bestResult;
      let articleIds = bestresult.map(res => {
        return res.articleId;
      });
      let arts = await Article.find({
        where: { id: articleIds, publishedAt: { '!=': null } },
        sort: 'publishedAt DESC'
      }).populate('keywords');

      arts = await getPublisherNames(arts);
      arts = await getCategory(arts);

      //arts = election_candidate_filter(arts, candidates);
      arts = arts.map(formatForTimeline);

      return { articles: arts, issue: issue };
      /**
            //let bestArticles = bestresult.length > result.length ? bestresult : result;
            if (bestresult.length <= result.length) {
              return Promise.all(sortedKeywordsQueries).then(async res => {
                let secondToLastResort = await getBestResultsFromKeywordSearch(res, 'arrayComp');
                if (secondToLastResort.length >= 3) {
                  return secondToLastResort.bestResult;
                } else {
                  let lastResort = await getBestResultsFromKeywordSearch(res, 'all');
                  return lastResort.bestResult;
                }
              });
            } else {
              return bestresult;
            }
            
          } else {
            return result;
          }
              **/
    })
    .catch(err => {
      console.log('error in getting articles via keyword search');
      console.log(err);
    });
}
async function getClimateChange() {
  const url = 'http://issue-identifier.herokuapp.com/cc_timeline';
  console.log('getting issue identified');
  try {
    const options = {
      method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      timeout: 10000
    };

    return await axios(options);
  } catch (err) {
    console.log('error in metadata scraper', err);
    return err;
  }

  return null;
}

function getTopIssue(issues) {
  let top_issue;
  let top_issue_kcount = 0;
  for (var i in issues) {
    let issue = issues[i];
    if (issue.top_matches.length > top_issue_kcount) {
      top_issue_kcount = issue.top_matches.length;
      top_issue = issue;
    }
  }
  return top_issue;
}

/**THIS WAS TAKEN FROM timeline.js FROM CONTROLLERS**/
function formatForTimeline(e) {
  if (e == undefined || e == null) {
    return {};
  }
  /**
  let culled_terms = [];
  if (e.terms !== undefined && e.terms.length > 1 && e.terms[0].length !== undefined && e.terms[0].length > 0) {
    culled_terms = culling(e.terms);
  }
  **/
  const apiRestrictedUrl = 'https://api.ap.org/media/v/content/';
  let eUrl = '';

  if (e.url !== undefined && e.url !== null) {
    eUrl = e.url.indexOf(apiRestrictedUrl) == 0 ? e.url.replace(apiRestrictedUrl, 'https://apnews.com/') : e.url;
  }

  let keyArr;
  let postProcessingDetails;
  if (e.hasOwnProperty('keywords')) {
    keyArr = e.keywords[0].keywords;
    //keywords now arrive frm db in array format
    // keyArr = e.keywords[0].keywords.replace(/[\{\}]*/gi, '').split(',');

    postProcessingDetails = { keywords: keyArr, category: e.category };
  } else {
    keyArr = [];
  }
  let returnMe = {
    id: e.id,
    title: e.title,
    url: eUrl,
    publishedAt: e.publishedAt,
    text: e.body,
    terms: _cullTerms(e.terms),
    artDetails: postProcessingDetails,
    category: e.category,
    publisherName: ''
  };
  if (e.publisher !== undefined && e.publisher !== null) {
    if (e.publisher.name) {
      returnMe.publisherName = e.publisher.name;
    }
  }
  return returnMe;
}
async function getCategory(articles) {
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
    publishers[pubUid] = await Publisher.findOne({ id: pubUid });
  }
  for (let i = 0; i < articles.length; i++) {
    let item = articles[i];
    item['publisher'] = publishers[item['publisher']];
    articlesWithPublishers.push(item);
  }
  return articlesWithPublishers;
}
function _cullTerms(terms, acceptableTerms) {
  if (!terms) {
    return [];
  }
  if (!acceptableTerms) {
    acceptableTerms = ['location', 'person', 'organization', 'other', 'event'];
  }

  return culling(terms, acceptableTerms);

  try {
    return culling(terms);
  } catch (err) {
    console.log('error in culling terms before entity search: ', err);
  }
}

function culling(terms, acceptableTerms) {
  let finalSet = [];
  let uniqueTerms = [];
  let removedTermsCount = 0;

  if (terms.length <= 1) {
    return terms;
    //    if (terms[0].length === 0 || terms[0].length === undefined) {
    //     return null;
    //   }
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
/*KEYWORD SEARCH USING THE TERMS SEARCH METHOD (case.. + ... end) -- FOR COVID TIMELINE ONLY RIGHT NOW*/

async function covidKeywordSearch(articleKeywords) {
  //determine which timeline best matches.
  let caseString = turnKeywordsIntoCaseQueryLines(articleKeywords);
  let a = 'select *, ';
  let b = ` (${caseString}) as score `;
  let c = `from timeline_keywords where ( ${caseString} > 1 ) order by score desc`;
  let query = a + b + c;

  let timeline_keyword_matches = await TimelineKeywords.getDatastore().sendNativeQuery(query, []);
  return timeline_keyword_matches.rows[0].id;
}
async function keywordIndividuallySearched(keywords, requiredKeywords) {
  //this method looks for matching article ids based on the loose match (ranked by match score) between the article's keywords and the candidate article's keywords.

  let minMatch = 2;

  if (keywords.length > 10) {
    minMatch = parseInt(keywords.length * 0.1);
  }
  const startTime = Date.now();
  let caseString = turnKeywordsIntoCaseQueryLines(keywords);
  let requiredKString = turnKeywordsIntoCaseQueryLines(requiredKeywords);
  let a = 'select *, ';
  let b = ` (${caseString}) as score `;
  let c = `from keywords where ( ${caseString} > ${minMatch}) and (${requiredKString} > 2) order by score desc`;
  let query = a + b + c;
  let result = await Keywords.getDatastore().sendNativeQuery(query, []);
  console.log('result rows: ', result.rows.length);

  let keywordsConsolidated = [];
  let articleIds = result.rows.map(res => res.articleId);
  return articleIds;
}
async function getMatchingTimelineForArticleKeywordsAgg(aggKeywords) {
  // aggKeywords holds all the keywords from articles that best matched the keyword search.
}
async function getBestMatchBasedOnTimelineComponentsKeywords(targetArticleKeywords) {
  //for the given articles' keywords, we search for the best TIMELINE match. Therefore, we need the keyword set PER TIMELINE
  var rawdata = fs.readFileSync('./data/timeline_keywords.json');
  var data = JSON.parse(rawdata);
  let winningTimeline = null;
  let winningTimelineKeywords = null;
  let winningTimelineKeywordsCount = 0;
  for (var d in data) {
    let line = data[d];
    let tid = line['timelineId'];

    let tkeys = line['aak'];
    let consolidated = new Set();
    let tklen = Math.min(tkeys.length, 5);
    for (var tklisti in tkeys.splice(0, tklen)) {
      let tklist = tkeys[tklisti];
      for (var tk in tklist) {
        consolidated.add(tklist[tk]);
      }
    }
    let intersection = targetArticleKeywords.filter(x => Array.from(consolidated).includes(x));

    if (intersection.length > winningTimelineKeywordsCount) {
      winningTimelineKeywords = Array.from(consolidated);
      winningTimeline = tid;
      winningTimelineKeywordsCount = intersection.length;
    }
  }
  return {
    timelineId: winningTimeline,
    timelineKeywords: winningTimelineKeywords,
    matchCount: winningTimelineKeywordsCount
  };
}
function consolidatedKeywords(articles) {
  let keywords = [];
  for (let a in articles) {
    let article = articles[a];
    if (article.hasOwnProperty('keywords')) {
    }
  }
}
function turnKeywordsIntoCaseQueryLines(keywords) {
  let caseStart = `CASE when keywords  @>  `;
  let caseEnd = ` then 1 else 0 end `;
  let termsLength = keywords.length;
  console.log('keywords for search length ', termsLength);
  let caseQuery = keywords.reduce((acc, curr, i) => {
    let caseMiddle = curr;
    if (i == termsLength - 1) {
      acc += `${caseStart}  array['${caseMiddle}']::varchar[] ${caseEnd}`;
    } else {
      if (i == 1) {
        return `${caseStart}  array['${caseMiddle}']::varchar[] ${caseEnd} + `;
      }
      acc += `${caseStart}  array['${caseMiddle}']::varchar[] ${caseEnd} + `;
    }
    return acc;
  });

  //caseQuery = caseQuery.length ? '( ' + caseQuery + `)  as score` : '';

  return caseQuery;
}

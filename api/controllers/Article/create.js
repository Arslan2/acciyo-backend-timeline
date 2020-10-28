const scraper = require('../../../scraper');
const { default: splitter } = require('full-name-splitter');

module.exports = {
  friendlyName: 'CreateArticle',

  description: 'Create an article in acciyo database.',

  inputs: {
    url: {
      description: 'Url of the article which needs to be created',
      type: 'string',
      required: true,
      in: 'body'
    }
  },
  exits: {
    success: {
      responseType: 'ok',
      description: 'Success response if the article already exists.'
    },

    created: {
      responseType: 'created',
      description: 'Created response if the article is created successfully.'
    },

    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function({ url }, exits) {
    try {
      const foundArticle = await Article.findOne({ url })
        .populate('authors')
        .populate('publishers');
      if (foundArticle) {
        return exits.success(foundArticle);
      }
      const metadata = await scraper(url);

      let [firstName, lastName] = splitter(metadata.author);
      firstName = firstName || '';
      lastName = lastName || '';

      let author, publisher;

      if (firstName || metadata.authorUrl) {
        author = await Author.findOrCreate(
          { or: [{ url: metadata.authorUrl }, { firstName, lastName }] },
          {
            firstName,
            lastName,
            url: metadata.authorUrl
          }
        );
      }
      if (metadata.publisher) {
        publisher = await Publisher.findOrCreate(
          { name: metadata.publisher },
          { name: metadata.publisher, url: metadata.homepage }
        );
      }

      const article = await Article.create({
        ...(author ? { authors: [author.id] } : {}),
        ...(publisher ? { publisher: publisher.id } : {}),
        categories: metadata.categories.toString(),
        title: metadata.title,
        terms: JSON.stringify(metadata.terms),
        url: url,
        publishedAt: metadata.publishedAt || null,
        language: metadata.language || 'en',
        body: metadata.body,
        source: 'article'
      }).fetch();

      const populatedArticle = await Article.findOne({ id: article.id })
        .populate('authors')
        .populate('publishers');
      return exits.created(populatedArticle);
    } catch (err) {
      console.log(err);
      return exits.serverError();
    }
  }
};

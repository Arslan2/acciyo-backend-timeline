<img src='https://static1.squarespace.com/static/5415c10be4b014f5fe7d48fb/t/5bb799531905f41771e0bbe0/1538759023781/acc_green.png' alt='Acciyo Backend' width='100px'>

# acciyo-backend

a [Sails v1](https://sailsjs.com) application

### Links

- [Sails framework documentation](https://sailsjs.com/get-started)
- [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
- [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
- [Community support options](https://sailsjs.com/support)
- [Professional / enterprise options](https://sailsjs.com/enterprise)

### Version info

This app was originally generated on Tue Nov 27 2018 17:00:36 GMT+0530 (IST) using Sails v1.1.0.

<!-- Internally, Sails used [`sails-generate@1.16.0`](https://github.com/balderdashy/sails-generate/tree/v1.16.0/lib/core-generators/new). -->

<!--
Note:  Generators are usually run using the globally-installed `sails` CLI (command-line interface).  This CLI version is _environment-specific_ rather than app-specific, thus over time, as a project's dependencies are upgraded or the project is worked on by different developers on different computers using different versions of Node.js, the Sails dependency in its package.json file may differ from the globally-installed Sails CLI release it was originally generated with.  (Be sure to always check out the relevant [upgrading guides](https://sailsjs.com/upgrading) before upgrading the version of Sails used by your app.  If you're stuck, [get help here](https://sailsjs.com/support).)
-->

#### Config/env Variables:

The following config variabes are neccessary to be given in order to start the server:

`AWS_ACCESS_KEY_ID` - aws access key

`AWS_SECRET_ACCESS_KEY` - aws secret key

`DIFFBOT_TOKEN` - diffbot key to use diffbot services

`DB_HOST` - database host name

`DB_NAME` - database name

`DB_USERNAME` - database username

`DB_PASSWORD` - database password if any

`DB_PORT` - database port

`AUTH0_CLIENT_ID` - client id for auth0

`AUTH0_CLIENT_SECRET` - client secret for auth0

`AUTH0_AUDIENCE` - audience used for encryption/decryption of password.

`AUTH0_CONNECTION` - db name used to store auth0 users.

`AUTH0_BASE_URL` - auth0 base url used by auth0 consumers.

#### Server Boot Up Instructions:

`npm run start:dev` - start server in develop environment.

`npm start` - start server in production environment.

Do a `npm install` for the first time.

### Database

_AWS Aurora PostgreSQL_ – selected for performance, observability & monitoring tools, and granular rollback features.

### API

##### Application Framework

- [`Sails`](https://www.npmjs.com/package/sails) : Selected for maturity, popularity, developer experience, built-in policies and and an extensive ecosystem that includes a large variety of ORM adapters.

- [`Sails PostgreSQL`](https://www.npmjs.com/package/sails-postgresql) : Official Sails PostgreSQL ORM adapter.

- [`AWS SDK`](https://www.npmjs.com/package/aws-sdk) : For interacting with Comprehend.

- [`Request`](https://www.npmjs.com/package/request) : Request is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default. It is used to interact with the 3rd party services like Auth0 and Diffbot.

- [`Metascraper`](https://www.npmjs.com/package/metascraper): A library to easily scrape metadata from an article on the web using Open Graph metadata, regular HTML metadata, and series of fallbacks. Mainly it is used to extract publisher information using `metascraper-publisher`.

- [`uuid`](https://www.npmjs.com/package/uuid) : Simple, fast generation of RFC4122 UUIDS. It is used to generate unique string indexes.

##### Developement Tools

- [`mocha`](https://www.npmjs.com/package/mocha) : Simple, flexible, fun JavaScript test framework for Node.js & The Browser.

- [`Prettier`](https://www.npmjs.com/package/prettier) : Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules.

- [`husky`](https://www.npmjs.com/package/husky) : Husky can prevent bad git commit, git push and more 🐶 woof!

##### Models

- _User_ : A registered user of the Acciyo application. Managed by `Auth0`. Used to keep track of GDPR consent date, an email/name for contact, and to provide an identity for analytics purposes.

Schema: `{ id: string, email: string, createdAt: Date, updatedAt: Date, consentedToGdprTrackingAt: Date, consentedToTransactionalCommunicationAt: Date, consentedToMarketingCommunicationAt: Date, }`;

Indexed Fields: `email, createdAt, updatedAt, consentedToGdprTrackingAt, consentedToTransactionalCommunicationAt, consentedToMarketingCommunicationAt`

- _Article_: An article that has been scraped by Acciyo, which may appear in a timeline.

Schema: `{ id: string, authors: Author[], body: string, language: string, title: string, source: enum (article|webpage) publishers: Publisher, terms: { type: TermType, text: string }[], url: string, publishedAt: Date, updatedAt: Date }`

Indexed Fields: `body, categories, language, title, source, terms, url, publishedAt, updatedAt`

- _Author_ : An author of an article.

Schema: `{ id: string, firstName: string, lastName: string, twitterHandle: ?string, articles: Article[], url: string, createdAt: Date, updatedAt: Date, }`

Indexed Fields: `firstName, lastName, twitterHandle, url, createdAt, updatedAt`

- _Publisher_ : The publisher of an article.

Schema: `{ id: string, name: string, url: string, articles: Article[], createdAt: Date, updatedAt: Date, }`

Indexed Fields: `name, url, createdAt, updatedAt`

#### DIRECTORY STRUCTURE:

Directory structure is maintained according `sails` guidlines with minor changes:

- `Scraper`: module is added in the root directory whose responsibilities is to retrieve metadata from different scrapers. It contains mainly 3 scrapers:

&emsp; 1. _MetaScraper_ - used to get publisher information.

&emsp; 2. _Diffbot_ - used to get various metadata like `whole text body`, `tags`, `language`, `title` etc.

&emsp; 3. _Comprehend_ - used to get named entities or we say relevant terms from article text using aws comprehend.

Diffbot and Metascraper are run in parallel to get different information and text from the metadata is given to comprehend to get relevnt terms and then returned to the desired module.

- `Consumers`: Apart from scrapers any communication with third party service is responsibility of the consumer module.

_A brief directory structure is as follows:_

`/api` - Container of sails controllers, models, helpers etc

&emsp;`/controllers` - actions that are linked with end points (All actions are created using sails [`action2`](https://sailsjs.com/documentation/concepts/actions-and-controllers) structure)

&emsp;&emsp; `/Article` - contain all actions related to articles

&emsp;&emsp; `/Auth` - contain actions related to sign-in,sign-up, google sign-in.

&emsp;&emsp; `/SwaggerController.js` - contain boilerplate code to create swagger compatible json.

&emsp; `/helpers` - contain [sails helpers](https://sailsjs.com/documentation/concepts/helpers)

&emsp; `/models` - contain sails [models](https://sailsjs.com/documentation/concepts/models-and-orm/models). Different [models](#models) are already defined above.

&emsp; `/policies` - contain sails [policies](https://sailsjs.com/documentation/concepts/policies).

`/config` - contain sails [config](https://sailsjs.com/documentation/reference/configuration).

`/consumers` - all 3rd party services to be consumed apart from `scraper` will be contained by this.

&emsp; `/auth0.js` - contains Auth0 api's consumers

`/scraper` - contains different scrapers.

&emsp; `/comprehend.js` - comprehend scraper.

&emsp; `/diffbot.js` - diffbot scraper.

&emsp; `/metascraper.js` - metascraper.

&emsp; `/index.js` - execute all scrapers and provide results to desired modules.

`/test` - container for all test cases.

&emsp; `/scraper` - contain test cases for scraper module.

`/app.js` - reponsible for bootstrapping the whole application and server.

### Routes

- **GET /articles (Timeline)** : Reponsible for providing timeline of relevant articles for the current article.

_Arguments (query)_:
`{ url - current tab URL to get timeline for}`

_Responses_:
`200 - articles:[], terms: { type: TermType, text: string }[]`

_Imlementation Flow_:
The end point implementation flow can be broken down to following points:

- Get url of the article from query and check if it exists in db or not.

- If it exists then metadata (extracted from article earlier) is already present in the database so retrieve this information from database.

- If it does not exist then use [`scraper`](#scraper) module to get metadata of article.

- Extract terms from the metadata and do a terms-terms matching, if one or more articles if found then return articles along with the terms retrieved from the page.

- If none of the articles are present then do a full-text of article's content (body) with the named entities(terms) and return the result.

Action File: `api/controllers/Article/timeline`

- **GET /articles (Timeline)** : Reponsible for providing timeline of relevant articles for the current article.

_Arguments (query)_:
`{ url - current tab URL to get timeline for}`

_Responses_:
`200 - articles:[], terms: { type: TermType, text: string }[]`

_Imlementation_:
The end point implementation flow can be broken down to following points:

- Get url of the article from query and check if it exists in db or not.

- If it exists then metadata (extracted from article earlier) is already present in the database so retrieve this information from database.

- If it does not exist then use [`scraper`](#scraper) module to get metadata of article.

- Extract terms from the metadata and do a terms-terms matching, if one or more articles if found then return articles along with the terms retrieved from the page.

- If none of the articles are present then do a full-text of article's content (body) with the named entities(terms) and return the result.

Action File: `api/controllers/Article/timeline`

- **GET /articles/:id (Article data)** : Reponsible for providing complete information of the article requested.

_Arguments (path)_:
`{ id - ID of the article requested }`

_Responses_:
`{200 - with article data if found, 404 - if no article is found }`

_Implementation_:

1. Fetch id from input (path param) and queries database for the desired article.

2. If article is found then returns `200` with article information.

3. if no article is found it returns `404`.

Action File: `api/controllers/Article/article-details`

- **POST /articles (create/scrape article)**: Reponsible for creating an article in database with required metadata whose url is provided.

_Arguments (body)_:
`{ url - url of the article to create/scrape }`

_Responses_:
`{200 - if article already exists, 201 - if article is successfully created, 500 - if an error occurs }`

_Implementation_:

1. Fetch url from input (request's body) and queries database for its exitstence.

2. If article is present then send `200` with the article information.

3. If not then use `scraper` module to get relevant metadata for the article.

4. Create article in the database with meta information and return `201` with the article information.

5. If any other error occurs then send `500`.

Action File: `api/controllers/Article/create`

- **POST /sign-in (Sign into Acciyo account)**: Reponsible to sign-in an existing Auth0 user into the system.

_Arguments (body)_:
`{ email - account email address, password - ac }`

_Responses_:
`{200 - {user - user data, authToken - Auth0 authentication token }, 403 - if the User credentials are incorrect}`

_Implementation_:

1. Fetch user's email and password from input (request body) and use Auth0 `sign-in consumer` to sign-in user to Auth0.

2. If sign-in consumer throws an error then retrun `403` with `Invalid Credentials` message.

3. If sign-in consumer executes successfully then retrieve authToken and create/find a user in database and return `200` with user created and authToken.

Action File: `api/controllers/Auth/sign-in`

- **POST /create-account (Create Acciyo account)**: Responsible for creating an Auth0 user and in the system.

_Arguments (body)_:
`{ email - account email address, password - account password, consent: boolean value regarding user's consent, offerings: boolean value indicate user want to get email about latest offerings }`

_Responses_:
`{201 - {user - user data, authToken - Auth0 authentication token }, 403 - if the user cannot be created due to validation errors.}`

_Implementation_:

1. Check database for the email of user, if already exists then return `403` with `User Already Exits` message.

2. If not, then use Auth0 sign-up consumer to create a user in Auth0.

3. If sign-up consumer throws an error return `403` with the error if it is a user account related error (refer to auth0 error codes) else return `500` with the error message from Auth0.

4. If it executes successfully retrieve authToken and then create a user in database.

5. Return `201` with the authToken and user created.

Action File: `api/controllers/Auth/sign-up`

- **POST /sign-in/google (Sign In Using Google)**:
  Responsible for providing user information and authToken using google's accessToken.

_Arguments (body)_:
`{ accessToken - token retrieved from google sign-in from frontend, consent: boolean value regarding user's consent,offerings: boolean value indicate user want to get email about latest offerings }`

_Responses_:
`{200 - {user - user data, authToken - Auth0 authentication token }, 403 - if the User credentials are incorrect}`

_Implementation_:

1. Fetch accessToken from input (request body) and use Auth0 `getUserInfo consumer` to validate the token and retrieve user's email from it.

2. If it throws an error then return `403` forbidden reponse.

3. If it executes successfully then retrieve user's email from it and find/create account in database and return `200` response with user data created and authToken.

Action File: `api/controllers/Auth/google-sign-in`

- **POST /check-user (Check for User Existance in Auth0)**:
  Responsible for providing information regarding user's existence in Auth0 using accessToken (In order to display terms & aggrements page if user doesn't exists).

_Arguments (body)_:
`{ accessToken - token retrieved from google sign-in from frontend }`

_Responses_:
`{200 - If user is found, 403 - If user is not found}`

_Implementation_:

1. Fetch accessToken from input (request body) and use Auth0 `getUserInfo consumer` to validate the token and retrieve user's email from it.

2. If it throws an error then return `403` forbidden response.

3. If it executes successfully then it and user data is not `null` then return `200` success response.

Action File: `api/controllers/Auth/check-user-exists`

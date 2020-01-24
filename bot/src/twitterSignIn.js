/*
  Twitter sign-in.

  https://developer.twitter.com/en/docs/basics/authentication/oauth-1-0a/obtaining-user-access-tokens

  Local host: http://127.0.0.1:8080
  Remote host: http://yourserver.com:8080
*/
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('express-logger');
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const sequelize = require('sequelize');
const inspect = require('util-inspect');
const oauth = require('oauth');

const config = require('./config.local');

const app = express();

// Get credentials: https://dev.twitter.com/apps
const _twitterConsumerKey = config.twitter.consumer_key;
const _twitterConsumerSecret = config.twitter.consumer_secret;

const consumer = new oauth.OAuth(
  'https://twitter.com/oauth/request_token',
  'https://twitter.com/oauth/access_token',
  _twitterConsumerKey,
  _twitterConsumerSecret,
  '1.0A', 'http://127.0.0.1:8080/sessions/callback',
  'HMAC-SHA1');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(logger({path: 'log/express.log'}));
app.use(cookieParser());
app.use(session({secret: 'very very secret', resave: false, saveUninitialized: true}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.get('/', function (req, res) {
	res.sendFile(path.resolve('index.html'));
});

app.get('/sessions/connect', function (req, res){
  consumer.getOAuthRequestToken(function (error, oauthToken, oauthTokenSecret, results) {
    if (error) {
      res.send('Error getting OAuth request token : ' + inspect(error), 500);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      console.log('------------------------');
      console.log('Request Token: ' + req.session.oauthRequestToken);
      console.log('Request Token Secret ' + req.session.oauthRequestTokenSecret);
      res.redirect('https://twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken);
    }
  });
});

app.get('/sessions/callback', function (req, res) {
  console.log('------------------------');
  console.log('Request Token: ' + req.session.oauthRequestToken);
  console.log('Request Token Secret: ' + req.session.oauthRequestTokenSecret);
  console.log('Verifier: ' + req.query.oauth_verifier);

  consumer.getOAuthAccessToken(
    req.session.oauthRequestToken,
    req.session.oauthRequestTokenSecret,
    req.query.oauth_verifier,
    function (error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if (error) {
        res.send(
          'Error getting token: ' +
          inspect(error) +
          '[' + oauthAccessToken + ']' +
          '[' + oauthAccessTokenSecret + ']' +
          '[' + inspect(results) + ']',
          500);
      } else {
        // Got the tokens.
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        res.redirect('/home');
      }
    }
  );
});

app.get('/home', function (req, res) {
  consumer.get(
    'https://api.twitter.com/1.1/account/verify_credentials.json',
    req.session.oauthAccessToken,
    req.session.oauthAccessTokenSecret,
    function (error, data, response) {
      if (error) {
        res.redirect('/sessions/connect');
      } else {
        const parsedData = JSON.parse(data);
        res.send('You are signed in: ' + inspect(parsedData.screen_name));
      }
    }
  );
});

app.listen(8080, function () {
  console.log('Running on port 8080.');
});

const algolia = require('algoliasearch');
const fetch = require('node-fetch');
const fs = require('fs');
const JSDOM = require('jsdom').JSDOM;

const DEBUG = false;
const indexPage = 'https://www.yang2020.com/policies/';
const policies = [];

module.exports.index = function () {
  fetch(indexPage)
    .then(res => res.text())
    .then(body => {
      console.log(`${indexPage} fetched.`);
      const document = new JSDOM(body).window.document;
      const links = document.querySelectorAll('article.policy a');

      const policiesFetched = Array.from(links).map((link, i) => {
        if (DEBUG && i > 5) { return; }
        const name = link.textContent.trim();
        policy = {name: name};
        policies.push(policy);
        return fetchPolicy(policy, link.getAttribute('href'));
      })

      Promise.all(policiesFetched).then(() => {
        fs.writeFileSync('./policies.json', JSON.stringify(policies));
      });
    });
}

function fetchPolicy (policy, policyUrl) {
  return fetch(policyUrl)
    .then(res => res.text())
    .then(body => {
      console.log(`${policyUrl} fetched.`);
      const document = new JSDOM(clean(body)).window.document;

      // Brief.
      policy.brief = '';
      document.querySelectorAll('.brief .column p').forEach(text => {
        const span = text.querySelector('span');
        if (span) {
          policy.brief += `${getText(span)}\n`;
          return;
        }
        policy.brief += `${getText(text)}\n`;
      });
      policy.brief = policy.brief.slice(0, -1);

      // Quote.
      policy.quote = getText(document.querySelector('.brief + blockquote .wrap'));

      // Problems.
      policy.problems = '';
      document.querySelectorAll('.problems-to-be-solved .column li').forEach(text => {
        policy.problems += `${getText(text)}\n`;
      });
      policy.problems = policy.problems.slice(0, -1);

      // Goals.
      policy.goals = '';
      document.querySelectorAll('.goals li').forEach(text => {
        policy.goals += `${getText(text)}\n`;
      });
      policy.goals = policy.goals.slice(0, -1);

      // Statement.
      policy.statement = '';
      const statementList = document.querySelectorAll('.as-president li');
      if (statementList.length) {
        statementList.forEach(text => {
          policy.statement += `${getText(text)}\n`;
        });
      } else {
        policy.statement = getText(document.querySelector('.as-president span'));
      }
    });
}

function getText (el) {
  return unescape(encodeURIComponent(el.textContent))
    .trim()
    .replace(/[ââââ]/g, '')
    .replace(/[â]/g, '-')
    .replace(/\xc3\x82\xc2\xa0/g, '')
    .replace(/\u0094/g, '')
    .replace(/  /, ' ')
    .replace(/ /, ' ')
    .trim();
}

function clean (body) {
  return body
    .replace(/\xc3/g, '')
    .replace(/\x82/g, '')
    .replace(/\xc2/g, '')
    .replace(/\xc2\x94/g, '')
    .replace(/\xa0/g, '')
    .replace(/\u0094/g, '');
}

module.exports.algolia = function () {
  const config = require('./config');
  const client = algolia(config.ALGOLIA_APP_ID, config.ALGOLIA_ADMIN_KEY);
  const index = client.initIndex('andrewyang');

  const policies = require('../policies.json').map(policy => {
    policy.objectID = policy.name;
    return policy;
  });
  index.saveObjects(policies, err => {
    if (err) { return console.error(err); }
    console.log('Indexed.');
  });
}
require('make-runnable');

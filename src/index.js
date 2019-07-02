const algolia = require('algoliasearch/lite');
const debounce = require('lodash.debounce');
const policyConfig = require('./policyConfig');
require('./index.styl');

const client = algolia('JYM7HVFCCH', '183859a024403b314e105277e94dfd61');
const index = client.initIndex('andrewyang');

const app = new Vue({
  el: '#app',

  data: {
    query: '',
    results: []
  },

  methods: {
    search: debounce(function (evt) {
      this.query = evt.target.value;
      if (this.query.length < 2) {
        this.results = [];
        return;
      }
      index.search({query: this.query}, (err, content) => {
        content.hits.map(result => {
          result.icon = policyConfig[result.name].icon;
          result.name = highlightQuery(result.name, this.query);

          const problem = highlightQuery(getFirstPoint(result.problems), this.query);
          result.problem = upperFirstLetter(problem);

          const statement = lowerFirstLetter(getFirstPoint(result.statement));
          result.statement = highlightQuery(statement, this.query);
        });
        this.results = content.hits;
      });
    }, 250),

    suggestion: function (evt) {
      const query = evt.target.closest('li').dataset.query;
      const search = document.getElementById('search');
      search.setAttribute('value', query);
      search.dispatchEvent(new CustomEvent('keydown'));
    }
  }
});

function getFirstPoint (string) {
  return string.split('\n')[0];
}

function highlightQuery (string, query) {
  if (!query) { return string; }
  const re = new RegExp(`(${query})`, 'gi');
  return string.replace(re, `<span class="searchHighlight">$1</span>`);
}

function lowerFirstLetter (string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function upperFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

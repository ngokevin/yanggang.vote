const algolia = require('algoliasearch/lite');
const debounce = require('lodash.debounce');
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
      if (this.query.length < 3) { return; }
      index.search({query: this.query}, (err, content) => {
        content.hits.map(result => {
          result.statement = `"As President, I will ${lowerFirstLetter(result.statement)}"`;
        });
        this.results = content.hits;
      });
    }, 250)
  }
});

function lowerFirstLetter (string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

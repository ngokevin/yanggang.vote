const algolia = require('algoliasearch/lite');
const debounce = require('lodash.debounce');
const policyConfig = require('./policyConfig');
require('./index.styl');

const client = algolia('JYM7HVFCCH', '183859a024403b314e105277e94dfd61');
const index = client.initIndex('andrewyang');

const DESKTOP = 1024;

const app = new Vue({
  el: '#app',

  data: {
    query: '',
    results: []
  },

  mounted: function () {
    index.getObjects([
      'The Freedom Dividend',
      'Human-Centered Capitalism',
      'Medicare for All',
      'Value-Added Tax',
      'Improve the American Scorecard',
      'Combat Climate Change',
      'Gun Safety',
      "Invest in America's Mental Health",
      'Foreign Policy First Principles',
      'Democracy Dollars'
    ]).then(data => {
      this.indexHits = data.results;
      this.handleSearch(data.results);
    });
    document.getElementById('app').classList.add('loaded');
  },

  updated: function () {
    const CARD_PADDING = 50;
    this.$nextTick(() => {
      Array.from(document.querySelectorAll('.resultContainer')).forEach(card => {
        if (card.parentNode.dataset.expanded === 'true') {
          if (window.innerWidth / window.devicePixelRatio >= DESKTOP) {
            card.style.height = card.parentNode.clientHeight - CARD_PADDING + 'px';
          }
        }
      });
    })
  },

  methods: {
    expand: function (name)  {
      const policy = this.results.filter(result => result.name === name);
      if (!policy) { return; }
      policy[0].expanded = true;
    },

    search: debounce(function (evt) {
      this.query = evt.target.value;
      if (!this.query && this.indexHits.length) {
        return this.handleSearch(this.indexHits);
      }
      if (this.query.length < 2) {
        this.results = [];
        return;
      }
      index.search({query: this.query}).then((content, err) => {
        this.handleSearch(content.hits);
      });
    }, 250),

    handleSearch: function (results) {
      results.forEach(result => {
        result.brief = result.brief.replace('\\n', '<br><br>');
        result.expanded = false;

        result.icon = policyConfig[result.name].icon;
        result.nameDisplay = highlightQuery(
          result.name.replace('Pharmaceutical', 'Pharma'), this.query);

        const problem = highlightQuery(getFirstPoint(result.problems), this.query);
        result.problem = upperFirstLetter(problem);

        const statement = lowerFirstLetter(getFirstPoint(result.statement));
        result.statement = truncate(highlightQuery(statement, this.query), 400);
      });

      this.results = results;
      document.getElementById('results').scrollLeft = 0;
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

function truncate (str, length) {
  if (!str) { return ''; }
  if (str.length >= length) {
    return str.substring(0, length - 3) + '...';
  }
  return str;
}

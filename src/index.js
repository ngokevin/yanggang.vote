const algolia = require('algoliasearch/lite');
import Bricks from 'bricks.js';
const debounce = require('lodash.debounce');
const policyConfig = require('./policyConfig');
require('./index.styl');

const client = algolia('JYM7HVFCCH', '183859a024403b314e105277e94dfd61');
const index = client.initIndex('andrewyang');

const newLine = /\\n/g;
const DESKTOP = 1024;

const app = new Vue({
  el: '#app',

  data: {
    query: '',
    results: [],
    testimonials: require('./testimonials'),
    view: 'policies'
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

    if (window.location.hash.toLowerCase() === '#switchedforyang') {
      this.view = 'switchedforyang';
    }
  },

  updated: function () {
    const CARD_PADDING = 50;
    this.$nextTick(() => {
      Array.from(document.querySelectorAll('.resultContainer')).forEach(card => {
        if (card.parentNode.dataset.expanded === 'true') {
          if (window.innerWidth / window.devicePixelRatio >= DESKTOP) {
            card.style.height = card.parentNode.clientHeight - CARD_PADDING + 'px';
          }
        } else {
          card.style.height = 'auto';
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
        result.brief = result.brief.replace(newLine, '<br><br>');
        result.expanded = false;

        result.icon = policyConfig[result.name].icon;
        result.nameDisplay = highlightQuery(
          result.name.replace('Pharmaceutical', 'Pharma'), this.query);

        const problem = highlightQuery(getFirstPoint(result.problems), this.query);
        result.problems = upperFirstLetter(problem).replace(newLine, '<br><br>');
        result.problemDisplay = upperFirstLetter(result.problems);

        const statement = lowerFirstLetter(getFirstPoint(result.statement))
        result.statementDisplay = truncate(highlightQuery(statement, this.query), 400);
        result.statement = lowerFirstLetter(result.statement).replace(newLine, '<br><br>');

        result.goals = result.goals.replace(newLine, '<br><br>');
      });

      this.results = results;

      const resultsEl = document.getElementById('results');
      if (resultsEl) {
        resultsEl.scrollLeft = 0;
        resultsEl.scrollTop = 0;
      }
    }
  },

  watch: {
    view: function (val) {
      if (val === 'switchedforyang') {
        this.$nextTick(() => {
          const bricks = new Bricks({
            container: document.getElementById('testimonials'),
            packed: 'data-packed',
            sizes: [
              {columns: 1, gutter: 20},
              {mq: '700px', columns: 2, gutter: 20},
              {mq: '1000px', columns: 3, gutter: 20},
              {mq: '1500px', columns: 4, gutter: 20}
            ]
          }).pack();
          setTimeout(() => { bricks.pack().resize(); });
        });
      }
    }
  }
});

const split = /\n|\\n/g;
function getFirstPoint (string) {
  return string.split(split)[0];
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

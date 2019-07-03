const algolia = require('algoliasearch/lite');
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
    testimonials: [
      {
        name: 'Fred R.',
        location: 'Mariscopa, AZ',
        why: '"I met with him and he rode in my truck."',
        link: 'https://twitter.com/@felon_fred',
        image: '/assets/firstTestimonial.jpg',
        candidate: 'Donald Trump'
      },
      {
        name: 'John B.',
        location: 'Kentucky',
        why: '"He is the only candidate trying to think of how to handle the automation future thats coming down the line. We have already seen the affects from China doing those jobs, but now as automation takes even more jobs that can\'t be outsourced, we will have MASSIVE unemployment and we need to plan NOW on how to handle that. Thats why I will vote for him."',
        candidate: 'Gary Johnson',
        link: 'https://reddit/u/Collective82'
      },
      {
        name: 'Sam M.',
        location: 'New York',
        why: '"Heard him on Ben Shapiro\'s Sunday special, and was surprised by his character, intelligence, common-sense, humane philosophy, torrent of fresh ideas, Everything! Even while I don\'t support some of his policies, he will still be the best president America has had in decades."',
        candidate: 'Abstained'
      },
      {
        name: 'Sarah M.',
        location: 'New York',
        why: '"His ideas are the best way forward. Period."',
        candidate: 'Donald Trump'
      },
      {
        name: 'Kelton K.',
        location: 'Phoenix, AZ',
        why: '"Yes!"',
        link: 'https://twitter.com/@tasteslikewall',
        candidate: 'Donald Trump'
      },
      {
        name: 'Chandler W.',
        location: 'Bellevue, WA',
        why: '"He\'s the only candidate talking about the real issues that are affecting and will be affecting people\'s daily lives - automation and AI displacing human jobs. In order to effectively tackle climate change and other issues, we need to address the mindset of scarcity that is affecting so many Americans (like the 78% that can\'t afford an extra $500 monthly expense). I\'m a conservative but above all else, I\'m a patriot that cares about where my country is headed if the Democrats and Republicans don\'t get their acts together."',
        link: 'https://twitter.com/@chandlerbwils0n',
        candidate: 'Gary Johnson'
      }
    ],
    view: ''
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
      });

      this.results = results;

      const resultsEl = document.getElementById('results');
      if (resultsEl) {
        resultsEl.scrollLeft = 0;
        resultsEl.scrollTop = 0;
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

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
    testimonials: [
      {
        name: 'John B.',
        location: 'Kentucky',
        why: '"He is the only candidate trying to think of how to handle the automation future that\'s coming down the line. We have already seen the affects from China doing those jobs, but now as automation takes even more jobs that can\'t be outsourced, we will have MASSIVE unemployment and we need to plan NOW on how to handle that. That\'s why I will vote for him."',
        candidate: 'Gary Johnson',
        username: '/u/Collective82'
      },
      {
        name: 'Polissa C.',
        location: 'Florence, AL',
        why: '"I voted Trump last time to avoid what I saw was a bigger evil. I am not voting Trump again. He is even worse than he came off before he got elected. He is in it for himself and to puff up his ego. Nothing has changed for our family since Trump entered office other than price of everything except gas has gone up it seems. I am disabled, and my husband works in food. My income is not enough to survive on much less thrive. And my husband\'s income at $10p/h at 33-/+hrs a week and must keep open availability to get hours isn\'t working. He loves his job. But it is a chain store and the number one complaint from restaurants is consistency of product. Automated kitchens are coming fast. The fancier places will survive but it\'s the chain stores like my husband\'s who will automate to save cost and operate with skeleton crews. What happens to us then. Yang is the only one saying what I\'ve been saying for the last 7 years. The future is now, and we can\'t afford to wait and make a plan tomorrow."',
        candidate: 'Donald Trump',
        username: '@CampbellPolissa'
      },
      {
        name: 'Chandler W.',
        location: 'Bellevue, WA',
        why: '"He\'s the only candidate talking about the real issues that are affecting and will be affecting people\'s daily lives - automation and AI displacing human jobs. In order to effectively tackle climate change and other issues, we need to address the mindset of scarcity that is affecting so many Americans (like the 78% that can\'t afford an extra $500 monthly expense). I\'m a conservative but above all else, I\'m a patriot that cares about where my country is headed if the Democrats and Republicans don\'t get their acts together."',
        username: '@chandlerbwils0n',
        candidate: 'Gary Johnson'
      },
      {
        name: 'Brandon B.',
        location: 'Dallas, TX',
        why: '"I have always considered myself a reasonable conservative. Someone who rarely voted straight down party lines and would always look for opportunities to see compromises. Andrew Yang represents that to me. My biggest problem with most democratic candidates is that I don\'t feel as though they recognize the problems that everyday Americans face. Andrew Yang, I believe, is the only candidate who not only recognizes the problems Americans face, but offers solutions based in today\'s America not solutions from decades past. I will always vote for someone who recognizes the issues over someone who doesn\'t, or manufactures new issues."',
        candidate: 'Donald Trump',
        username: '@brandon_b12'
      },
      {
        name: 'Ryan W.',
        location: 'USA',
        why: '"Raised conservative...pretty much my whole family is. I voted for Trump as a lesser of two evils also. I was never his biggest fan, but he won the Republican primary and Bernie lost the Democratic primary so I felt I had 2 sucky choices. I want Yang to win because Yang represents to me actually having a real choice in this election."',
        candidate: 'Donald Trump'
      },
      {
        name: 'Sam M.',
        location: 'New York',
        why: '"Heard him on Ben Shapiro\'s Sunday special, and was surprised by his character, intelligence, common-sense, humane philosophy, torrent of fresh ideas, Everything! Even while I don\'t support some of his policies, he will still be the best president America has had in decades."',
        candidate: 'Abstained'
      },
      {
        name: 'Fred R.',
        location: 'Mariscopa, AZ',
        why: '"I met with him and he rode in my truck."',
        username: '@felon_fred',
        image: '/assets/firstTestimonial.jpg',
        candidate: 'Donald Trump'
      },
      {
        name: 'Sarah M.',
        location: 'New York',
        why: '"His ideas are the best way forward. Period."',
        candidate: 'Donald Trump'
      },
      {
        name: 'Scott H.',
        location: 'Latham, NY',
        why: '"Support all of his forward thinking, bipartisan ideas."',
        candidate: 'Donald Trump'
      },
      {
        name: 'Kelton K.',
        location: 'Phoenix, AZ',
        why: '"Yes!"',
        username: '@tasteslikewall',
        candidate: 'Donald Trump'
      },
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
              {mq: '1400px', columns: 4, gutter: 20}
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

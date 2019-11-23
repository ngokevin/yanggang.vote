const Reddit = require('snoowrap');
const clean = require('./scrape').clean;
const db = require('../events.json');
const fs = require('fs');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');

const subreddits = [
  'AlaskaForYang',
  'AlabamaForYang',
  'ArkansasForYang',
  'ArizonaForYang',
  'CaliforniaForYang',
  'ColoradoForYang',
  'ConnecticutForYang',
  'DCForYang',
  'DelawareForYang',
  'FloridaForYang',
  'GeorgiaForYang',
  'HawaiiForYang',
  'IowaForYang',
  'IdahoForYang',
  'IllinoisForYang',
  'IndianaForYang',
  'KansasForYang',
  'KentuckyForYang',
  'LouisianaForYang',
  'MassachusettsForYang',
  'MarylandForYang',
  'MaineForYang',
  'MichiganForYang',
  'MinnesotaForYang',
  'MissouriForYang',
  'MississippiForYang',
  'MontanaForYang',
  'NCForYang',
  'NorthDakotaForYang',
  'NebraskaForYang',
  'NewHampshireForYang',
  'NewJerseyForYang',
  'NewMexicoForYang',
  'NewYorkForYang',
  'NevadaForYang',
  'OhioForYang',
  'OklahomaForYang',
  'OregonForYang',
  'PennsylvaniaForYang',
  'RIForYang',
  'SouthCarolinaForYang',
  'TennesseeForYang',
  'TexasForYang',
  'UtahForYang',
  'VirginiaForYang',
  'VermontForYang',
  'WashingtonForYang',
  'WisconsinForYang',
  'WestVirginiaForYang',
  'WyomingForYang'
];

const counts = {};

module.exports.scrape = function post () {
  const client = new Reddit(require('./config.local'));
  let total = 0;

  const promises = subreddits.map(subreddit => {
    return client
      .getSubreddit(subreddit)
      .fetch()
      .then(res => {
        counts[subreddit] = res.subscribers;
        total += res.subscribers;
      });
  });

  Promise.all(promises).then(() => {
    counts.total = total;
    fs.writeFileSync('../src/subredditCounts.json', JSON.stringify(counts));
  });
}

require('make-runnable');
